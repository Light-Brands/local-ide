'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../../stores/ideStore';
import { useMobileDetect } from '../../../hooks';
import { getCurrentRepoTree, getCurrentRepoFile, saveCurrentRepoFile, getLanguageFromPath as getGitHubLanguage } from '@/lib/ide/services/github';
import type { FileNode } from '@/lib/ide/services/github';
import { getLocalFileTree, getLocalFile, saveLocalFile, getLanguageFromPath } from '@/lib/ide/services/local-files';
import type { LocalFileNode, FileTreeScope } from '@/lib/ide/services/local-files';
import { getActivityService } from '@/lib/ide/services/activity';
import { FileTree } from './FileTree';
import { FileTabs } from './FileTabs';
import { CodeEditor } from './CodeEditor';
import {
  File,
  Folder,
  ChevronLeft,
  Save,
  Check,
  Loader2,
  AlertCircle,
  X,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

export function EditorPane() {
  const isMobile = useMobileDetect();

  // Mobile-specific state: browser or editor mode
  const [mobileMode, setMobileMode] = useState<'browser' | 'editor'>('browser');
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  // File tree scope: 'workspace' shows user-editable files, 'all' shows everything
  const [treeScope, setTreeScope] = useState<FileTreeScope>('workspace');

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommitDialog, setShowCommitDialog] = useState(false);

  // Store state - access state directly, not through the editor getter
  const openFiles = useIDEStore((state) => state.openFiles);
  const activeFile = useIDEStore((state) => state.activeFile);
  const fileTree = useIDEStore((state) => state.fileTree);
  const expandedFolders = useIDEStore((state) => state.expandedFolders);
  const unsavedChanges = useIDEStore((state) => state.unsavedChanges);
  const fileContents = useIDEStore((state) => state.fileContents);
  const isLoadingTree = useIDEStore((state) => state.isLoadingTree);
  const isLoadingFile = useIDEStore((state) => state.isLoadingFile);
  const error = useIDEStore((state) => state.editorError);
  const github = useIDEStore((state) => state.integrations.github);

  // Store actions
  const openFile = useIDEStore((state) => state.openFile);
  const closeFile = useIDEStore((state) => state.closeFile);
  const setActiveFile = useIDEStore((state) => state.setActiveFile);
  const setFileTree = useIDEStore((state) => state.setFileTree);
  const toggleFolder = useIDEStore((state) => state.toggleFolder);
  const setFileContent = useIDEStore((state) => state.setFileContent);
  const setEditorLoading = useIDEStore((state) => state.setEditorLoading);
  const setEditorError = useIDEStore((state) => state.setEditorError);
  const setUnsavedChange = useIDEStore((state) => state.setUnsavedChange);
  const clearUnsavedChange = useIDEStore((state) => state.clearUnsavedChange);

  // Fetch file tree - always use local files for local IDE
  const fetchFileTree = useCallback(async (scope?: FileTreeScope) => {
    setEditorLoading('tree', true);
    setEditorError(null);

    try {
      // Always use local file system API for local IDE
      const scopeToUse = scope ?? treeScope;
      console.log('[EditorPane] Fetching local file tree with scope:', scopeToUse);
      const tree = await getLocalFileTree(scopeToUse);
      console.log('[EditorPane] Got file tree:', tree.length, 'items');
      setFileTree(tree as unknown as FileNode[]);
    } catch (err) {
      console.error('[EditorPane] Failed to fetch file tree:', err);
      setEditorError(err instanceof Error ? err.message : 'Failed to fetch file tree');
    } finally {
      setEditorLoading('tree', false);
    }
  }, [setEditorLoading, setEditorError, setFileTree, treeScope]);

  // Handle scope change
  const handleScopeChange = useCallback((newScope: FileTreeScope) => {
    setTreeScope(newScope);
    fetchFileTree(newScope);
  }, [fetchFileTree]);

  // Fetch file tree on mount
  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  // Load file content - always use local files for local IDE
  const loadFileContent = useCallback(async (path: string) => {
    if (fileContents[path] || unsavedChanges[path] !== undefined) return;

    setEditorLoading('file', true);
    setEditorError(null);

    try {
      console.log('[EditorPane] Loading file:', path);
      const file = await getLocalFile(path);
      setFileContent(path, file.content, '');
    } catch (err) {
      console.error('[EditorPane] Failed to load file:', err);
      setEditorError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setEditorLoading('file', false);
    }
  }, [fileContents, unsavedChanges, setEditorLoading, setEditorError, setFileContent]);

  // Load file when active file changes
  useEffect(() => {
    if (activeFile && !fileContents[activeFile]) {
      loadFileContent(activeFile);
    }
  }, [activeFile, fileContents, loadFileContent]);

  // Handle file click
  const handleFileClick = useCallback((path: string) => {
    openFile(path);
    if (!fileContents[path]) {
      loadFileContent(path);
    }
    getActivityService().trackFileOpen(path);

    // Switch to editor mode on mobile
    if (isMobile) {
      setMobileMode('editor');
    }
  }, [openFile, fileContents, loadFileContent, isMobile]);

  // Get current file content
  const getCurrentContent = useCallback((path: string): string => {
    if (unsavedChanges[path] !== undefined) {
      return unsavedChanges[path];
    }
    return fileContents[path]?.content || '';
  }, [unsavedChanges, fileContents]);

  // Handle content change
  const handleContentChange = useCallback((content: string) => {
    if (!activeFile) return;

    const originalContent = fileContents[activeFile]?.content || '';
    if (content !== originalContent) {
      setUnsavedChange(activeFile, content);
    } else {
      clearUnsavedChange(activeFile);
    }
  }, [activeFile, fileContents, setUnsavedChange, clearUnsavedChange]);

  // Initiate save
  const initiateSave = useCallback(() => {
    if (!activeFile || unsavedChanges[activeFile] === undefined) return;
    const fileName = activeFile.split('/').pop() || activeFile;
    setCommitMessage(`Update ${fileName}`);
    setShowCommitDialog(true);
  }, [activeFile, unsavedChanges]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!activeFile || unsavedChanges[activeFile] === undefined) return;

    setIsSaving(true);
    setEditorError(null);

    try {
      const content = unsavedChanges[activeFile];
      const sha = fileContents[activeFile]?.sha;
      const message = commitMessage || `Update ${activeFile.split('/').pop()}`;

      const result = await saveCurrentRepoFile(activeFile, content, message, sha);

      setFileContent(activeFile, content, result.sha);
      clearUnsavedChange(activeFile);

      getActivityService().trackFileSave(activeFile, result.sha);
      getActivityService().trackGitCommit(message, result.sha);

      setShowCommitDialog(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Failed to save file');
    } finally {
      setIsSaving(false);
    }
  }, [activeFile, unsavedChanges, fileContents, commitMessage, setFileContent, clearUnsavedChange, setEditorError]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeFile && unsavedChanges[activeFile] !== undefined) {
          initiateSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, unsavedChanges, initiateSave]);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-neutral-900">
        {mobileMode === 'browser' ? (
          // File browser mode
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-800">
              <span className="text-sm font-medium text-white">
                {github.repo || 'Files'}
              </span>
              {openFiles.length > 0 && (
                <button
                  onClick={() => setMobileMode('editor')}
                  className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg"
                >
                  Open Editor ({openFiles.length})
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <FileTree
                tree={fileTree}
                expandedFolders={expandedFolders}
                activeFile={activeFile}
                unsavedFiles={unsavedChanges}
                isLoading={isLoadingTree}
                error={error}
                onFileClick={handleFileClick}
                onFolderToggle={toggleFolder}
                onRefresh={() => fetchFileTree()}
                repoName={github.repo || undefined}
                scope={treeScope}
                onScopeChange={handleScopeChange}
              />
            </div>
          </div>
        ) : (
          // Editor mode
          <div className="h-full flex flex-col">
            {/* Mobile editor header */}
            <div className="flex-shrink-0 flex items-center gap-2 px-2 py-2 border-b border-neutral-800 bg-neutral-900">
              <button
                onClick={() => setMobileMode('browser')}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {activeFile && (
                <>
                  <span className="text-sm text-white truncate flex-1">
                    {activeFile.split('/').pop()}
                  </span>

                  {unsavedChanges[activeFile] !== undefined && (
                    <button
                      onClick={initiateSave}
                      disabled={isSaving}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        saveSuccess
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-primary-500 text-white'
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : saveSuccess ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saveSuccess ? 'Saved' : 'Save'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Mobile tabs */}
            <FileTabs
              openFiles={openFiles}
              activeFile={activeFile}
              unsavedFiles={unsavedChanges}
              onFileSelect={setActiveFile}
              onFileClose={closeFile}
            />

            {/* Mobile editor content */}
            <div className="flex-1 overflow-hidden">
              {activeFile ? (
                isLoadingFile && !fileContents[activeFile] ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                  </div>
                ) : (
                  <CodeEditor
                    value={getCurrentContent(activeFile)}
                    onChange={handleContentChange}
                    language={getLanguageFromPath(activeFile)}
                    onSave={initiateSave}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-8">
                  <File className="w-12 h-12 text-neutral-600 mb-3" />
                  <p className="text-neutral-400">No file selected</p>
                  <button
                    onClick={() => setMobileMode('browser')}
                    className="mt-4 text-primary-400 text-sm"
                  >
                    Browse files
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Commit dialog */}
        {showCommitDialog && (
          <CommitDialog
            fileName={activeFile?.split('/').pop() || ''}
            commitMessage={commitMessage}
            setCommitMessage={setCommitMessage}
            onCancel={() => setShowCommitDialog(false)}
            onSave={handleSave}
            isSaving={isSaving}
            error={error}
          />
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-full flex bg-neutral-900 relative">
      {/* File tree sidebar or toggle button */}
      {showSidebar ? (
        <div className="w-60 flex-shrink-0 relative">
          <FileTree
            tree={fileTree}
            expandedFolders={expandedFolders}
            activeFile={activeFile}
            unsavedFiles={unsavedChanges}
            isLoading={isLoadingTree}
            error={error}
            onFileClick={handleFileClick}
            onFolderToggle={toggleFolder}
            onRefresh={() => fetchFileTree()}
            repoName={github.repo || undefined}
            scope={treeScope}
            onScopeChange={handleScopeChange}
          />
          <button
            onClick={() => setShowSidebar(false)}
            className="absolute top-2 right-2 p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded transition-colors"
            title="Hide sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Collapsed sidebar - show toggle strip */
        <div className="w-10 flex-shrink-0 flex flex-col items-center py-2 border-r border-neutral-800 bg-neutral-900">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
            title="Show file explorer"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSidebar(true)}
            className="mt-2 p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
            title="Show file explorer"
          >
            <Folder className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <FileTabs
          openFiles={openFiles}
          activeFile={activeFile}
          unsavedFiles={unsavedChanges}
          onFileSelect={setActiveFile}
          onFileClose={closeFile}
        />

        {/* Editor content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <>
              {/* File info bar */}
              <div className="flex items-center justify-between px-4 py-1.5 text-xs border-b border-neutral-800 bg-neutral-900/50">
                <span className="flex items-center gap-2 text-neutral-400">
                  {activeFile}
                  {unsavedChanges[activeFile] !== undefined && (
                    <span className="text-primary-400">(unsaved)</span>
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500 uppercase">
                    {getLanguageFromPath(activeFile)}
                  </span>
                  {unsavedChanges[activeFile] !== undefined && (
                    <button
                      onClick={initiateSave}
                      disabled={isSaving}
                      className={cn(
                        'flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                        saveSuccess
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                      )}
                    >
                      {isSaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : saveSuccess ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
                    </button>
                  )}
                </div>
              </div>

              {/* Code editor */}
              {isLoadingFile && !fileContents[activeFile] ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    value={getCurrentContent(activeFile)}
                    onChange={handleContentChange}
                    language={getLanguageFromPath(activeFile)}
                    onSave={initiateSave}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <File className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400">Select a file to edit</p>
                {!github.connected && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Connect to GitHub to browse files
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Commit dialog */}
      {showCommitDialog && (
        <CommitDialog
          fileName={activeFile?.split('/').pop() || ''}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onCancel={() => setShowCommitDialog(false)}
          onSave={handleSave}
          isSaving={isSaving}
          error={error}
        />
      )}
    </div>
  );
}

// Commit dialog component
function CommitDialog({
  fileName,
  commitMessage,
  setCommitMessage,
  onCancel,
  onSave,
  isSaving,
  error,
}: {
  fileName: string;
  commitMessage: string;
  setCommitMessage: (message: string) => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-semibold text-white">Commit Changes</h3>
            <p className="text-sm text-neutral-400 mt-0.5">{fileName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Commit Message
          </label>
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none placeholder:text-neutral-500"
            rows={3}
            placeholder="Describe your changes..."
            autoFocus
          />
          {error && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-800 bg-neutral-900/50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !commitMessage.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Committing...' : 'Commit & Push'}
          </button>
        </div>
      </div>
    </div>
  );
}
