'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Search,
  Grid,
  List,
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  MoreHorizontal,
  Download,
  Trash2,
  Copy,
  X,
  FolderOpen,
  Sparkles,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoMedia, formatFileSize } from '@/data/content/demoData';
import { containerVariants, itemVariants } from '@/components/content/shared';
import { colors } from '@/lib/design/tokens';

const typeIcons = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  archive: FolderOpen,
};

const typeColors = {
  image: cn(colors.primary.text, colors.primary.bg),
  video: cn(colors.secondary.text, colors.secondary.bg),
  audio: cn(colors.success.text, colors.success.bg),
  document: cn(colors.primary.text, colors.primary.bg),
  archive: 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-500/10',
};

const folders = ['All Files', 'banners', 'videos', 'team', 'documents', 'audio', 'icons'];

export default function MediaLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('All Files');
  const [isDragging, setIsDragging] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredMedia = demoMedia.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'All Files' || item.folder === selectedFolder;
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesSearch && matchesFolder && matchesType;
  });

  const selectedMedia = selectedItem ? demoMedia.find((m) => m.id === selectedItem) : null;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="admin-section"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Media Library
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Upload and manage your media files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'text-neutral-700 dark:text-neutral-300',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors'
            )}
            aria-label="Generate media with AI"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            AI Generate
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
              'bg-primary text-primary-foreground',
              'hover:bg-primary-hover transition-colors'
            )}
            aria-label="Upload new files"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            Upload Files
          </motion.button>
        </div>
      </motion.div>

      {/* Filters and View Toggle */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            )}
            aria-label="Search media files"
          />
        </div>

        {/* Type Filter */}
        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-800',
            'text-neutral-700 dark:text-neutral-300',
            'hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors'
          )}
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <Filter className="w-4 h-4" aria-hidden="true" />
          {typeFilter ? typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1) : 'All Types'}
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* View Mode Toggle */}
        <div className="flex gap-2" role="tablist" aria-label="View mode">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
            role="tab"
            aria-selected={viewMode === 'grid'}
            aria-label="Grid view"
          >
            <Grid className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
            role="tab"
            aria-selected={viewMode === 'list'}
            aria-label="List view"
          >
            <List className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>

      {/* Folders */}
      <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2 mb-6" role="tablist" aria-label="Media folders">
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => setSelectedFolder(folder)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              selectedFolder === folder
                ? 'bg-primary text-primary-foreground'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
            role="tab"
            aria-selected={selectedFolder === folder}
          >
            {folder}
          </button>
        ))}
      </motion.div>

      {/* Upload Drop Zone */}
      <motion.div
        variants={itemVariants}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        className={cn(
          'p-8 rounded-xl border-2 border-dashed text-center transition-all mb-6',
          'bg-white dark:bg-neutral-900',
          isDragging
            ? cn('border-primary', colors.primary.bg)
            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        )}
        role="region"
        aria-label="File upload drop zone"
      >
        <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" aria-hidden="true" />
        <p className="text-neutral-600 dark:text-neutral-400">
          Drag and drop files here, or{' '}
          <button className={cn('font-medium hover:underline', colors.primary.text)}>browse</button>
        </p>
        <p className="text-sm text-neutral-400 mt-1">
          Supports: JPG, PNG, GIF, SVG, PDF, MP4, MP3, WebP
        </p>
      </motion.div>

      {/* Media Grid/List */}
      <motion.div variants={itemVariants} className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <AnimatePresence>
                {filteredMedia.map((item, index) => {
                  const Icon = typeIcons[item.type as keyof typeof typeIcons];
                  const colorClass = typeColors[item.type as keyof typeof typeColors];

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedItem(item.id)}
                      whileHover={{ y: -2 }}
                      className={cn(
                        'group relative bg-white dark:bg-neutral-900 rounded-xl border overflow-hidden cursor-pointer transition-all',
                        selectedItem === item.id
                          ? cn('border-primary ring-2 ring-primary/20', colors.primary.border)
                          : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm'
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        {item.type === 'image' ? (
                          <div className="w-full h-full bg-neutral-200 dark:bg-neutral-700" />
                        ) : (
                          <Icon className={cn('w-12 h-12', colorClass.split(' ')[0])} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{formatFileSize(item.size)}</p>
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-white dark:bg-neutral-900 rounded-lg shadow-lg">
                          <MoreHorizontal className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                        </button>
                      </div>

                      {/* Usage Badge */}
                      {item.usageCount > 0 && (
                        <div className="absolute bottom-14 left-2 px-2 py-0.5 bg-neutral-900/80 dark:bg-white/80 text-white dark:text-neutral-900 text-[10px] font-medium rounded-full">
                          Used {item.usageCount}x
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className={cn(
              'rounded-xl border overflow-hidden',
              'bg-white dark:bg-neutral-900',
              'border-neutral-200/60 dark:border-neutral-800/60'
            )}>
              <table className="w-full border-collapse" role="grid">
                <thead>
                  <tr className="border-b border-neutral-200/60 dark:border-neutral-800/60">
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Name</th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Type</th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Size</th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Folder</th>
                    <th scope="col" className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Usage</th>
                    <th scope="col" className="w-12 py-3 px-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMedia.map((item) => {
                    const Icon = typeIcons[item.type as keyof typeof typeIcons];
                    const colorClass = typeColors[item.type as keyof typeof typeColors];

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item.id)}
                        className={cn(
                          'cursor-pointer transition-colors border-b border-neutral-200/60 dark:border-neutral-800/60',
                          selectedItem === item.id
                            ? colors.primary.bg
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        )}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colorClass)} aria-hidden="true">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-white">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">{item.type}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">
                            {formatFileSize(item.size)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">{item.folder}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 tabular-nums">{item.usageCount}x</span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" aria-label={`Actions for ${item.name}`}>
                            <MoreHorizontal className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Panel */}
        <AnimatePresence>
          {selectedMedia && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                'hidden lg:block w-80 overflow-hidden rounded-xl border',
                'bg-white dark:bg-neutral-900',
                'border-neutral-200/60 dark:border-neutral-800/60'
              )}
              role="complementary"
              aria-label="Media details"
            >
              {/* Preview */}
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {selectedMedia.type === 'image' ? (
                  <div className="w-full h-full bg-neutral-200 dark:bg-neutral-700" />
                ) : (
                  (() => {
                    const Icon = typeIcons[selectedMedia.type as keyof typeof typeIcons];
                    return <Icon className="w-16 h-16 text-neutral-400" />;
                  })()
                )}
              </div>

              {/* Details */}
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-neutral-900 dark:text-white break-all pr-2">
                    {selectedMedia.name}
                  </h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                  >
                    <X className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Type</span>
                    <span className="text-neutral-900 dark:text-white capitalize">{selectedMedia.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Size</span>
                    <span className="text-neutral-900 dark:text-white">{formatFileSize(selectedMedia.size)}</span>
                  </div>
                  {selectedMedia.dimensions && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Dimensions</span>
                      <span className="text-neutral-900 dark:text-white">
                        {selectedMedia.dimensions.width}x{selectedMedia.dimensions.height}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Folder</span>
                    <span className="text-neutral-900 dark:text-white">{selectedMedia.folder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Usage</span>
                    <span className="text-neutral-900 dark:text-white">{selectedMedia.usageCount} references</span>
                  </div>
                </div>

                {/* Alt Text */}
                <div className="flex flex-col gap-2 pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
                  <label htmlFor="alt-text" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Alt Text
                  </label>
                  <textarea
                    id="alt-text"
                    defaultValue={selectedMedia.altText}
                    rows={2}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm resize-none',
                      'bg-white dark:bg-neutral-900',
                      'border border-neutral-200 dark:border-neutral-800',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    )}
                    aria-describedby="alt-text-help"
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-2">
                  <button className={cn(
                    'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200 dark:border-neutral-800',
                    'text-neutral-700 dark:text-neutral-300',
                    'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  )}>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    Copy URL
                  </button>
                  <button className={cn(
                    'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200 dark:border-neutral-800',
                    'text-neutral-700 dark:text-neutral-300',
                    'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  )}>
                    <Download className="w-4 h-4" aria-hidden="true" />
                    Download
                  </button>
                  <button className={cn(
                    'flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    colors.error.text,
                    colors.error.bg
                  )}>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
