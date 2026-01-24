'use client';

import { useEffect, useRef, memo } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { indentOnInput, bracketMatching, foldGutter, foldKeymap, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { lintKeymap } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';

// Language imports
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { rust } from '@codemirror/lang-rust';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  className?: string;
  onSave?: () => void;
}

// Get language extension based on file extension
function getLanguageExtension(language: string): Extension | null {
  const langMap: Record<string, () => Extension> = {
    javascript: () => javascript(),
    typescript: () => javascript({ typescript: true }),
    jsx: () => javascript({ jsx: true }),
    tsx: () => javascript({ jsx: true, typescript: true }),
    html: () => html(),
    css: () => css(),
    json: () => json(),
    markdown: () => markdown(),
    md: () => markdown(),
    python: () => python(),
    py: () => python(),
    rust: () => rust(),
    rs: () => rust(),
  };

  const getLang = langMap[language.toLowerCase()];
  return getLang ? getLang() : null;
}

export const CodeEditor = memo(function CodeEditor({
  value,
  onChange,
  language = 'javascript',
  readOnly = false,
  className = '',
  onSave,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const isInternalUpdate = useRef(false);

  // Store callbacks in refs to avoid recreating editor
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Keep refs up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Build extensions
    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...foldKeymap,
        ...completionKeymap,
        ...lintKeymap,
        indentWithTab,
        // Add Cmd/Ctrl+S for save (uses ref so it's always current)
        {
          key: 'Mod-s',
          run: () => {
            onSaveRef.current?.();
            return true;
          },
        },
      ]),
      oneDark,
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        },
        '.cm-content': {
          padding: '8px 0',
        },
        '.cm-gutters': {
          backgroundColor: 'transparent',
          borderRight: '1px solid #333',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        '.cm-activeLine': {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        },
      }),
      // Update listener (uses ref so it's always current)
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !isInternalUpdate.current) {
          const newValue = update.state.doc.toString();
          onChangeRef.current(newValue);
        }
      }),
      EditorState.readOnly.of(readOnly),
    ];

    // Add language extension if available
    const langExt = getLanguageExtension(language);
    if (langExt) {
      extensions.push(langExt);
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [language, readOnly]); // Re-create editor when language or readOnly changes

  // Update content when value prop changes (from external source)
  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== value) {
      isInternalUpdate.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
      isInternalUpdate.current = false;
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-hidden bg-neutral-950 ${className}`}
    />
  );
});
