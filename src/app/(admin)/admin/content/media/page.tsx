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

const typeIcons = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  document: FileText,
  archive: FolderOpen,
};

const typeColors = {
  image: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  video: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  audio: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  document: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  archive: 'text-neutral-500 bg-neutral-50 dark:bg-neutral-900/20',
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
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Media Library
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Upload and manage your media files
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            AI Generate
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary-500/25"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </motion.button>
        </div>
      </motion.div>

      {/* Filters and View Toggle */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'text-sm text-neutral-900 dark:text-white',
              'placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
            )}
          />
        </div>

        {/* Type Filter */}
        <div className="relative">
          <button
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200 dark:border-neutral-800',
              'text-sm font-medium text-neutral-700 dark:text-neutral-300',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800'
            )}
          >
            <Filter className="w-4 h-4" />
            {typeFilter ? typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1) : 'All Types'}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'grid'
                ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'list'
                ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Folders */}
      <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2">
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => setSelectedFolder(folder)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              selectedFolder === folder
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
            )}
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
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        )}
      >
        <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-600 dark:text-neutral-400">
          Drag and drop files here, or{' '}
          <button className="text-primary-500 font-medium hover:underline">browse</button>
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
                        'group relative bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden cursor-pointer transition-all',
                        selectedItem === item.id
                          ? 'border-primary-500 ring-2 ring-primary-500/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-lg'
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        {item.type === 'image' ? (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800" />
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
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Folder
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredMedia.map((item) => {
                    const Icon = typeIcons[item.type as keyof typeof typeIcons];
                    const colorClass = typeColors[item.type as keyof typeof typeColors];

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItem(item.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          selectedItem === item.id
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClass)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-neutral-900 dark:text-white">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">{item.type}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {formatFileSize(item.size)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-500">{item.folder}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 dark:text-neutral-400">{item.usageCount}x</span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                            <MoreHorizontal className="w-4 h-4 text-neutral-400" />
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
              className="hidden lg:block w-80 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
            >
              {/* Preview */}
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                {selectedMedia.type === 'image' ? (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800" />
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
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Alt Text
                  </label>
                  <textarea
                    defaultValue={selectedMedia.altText}
                    rows={2}
                    className={cn(
                      'w-full px-3 py-2 rounded-xl resize-none',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-sm text-neutral-900 dark:text-white',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
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
