'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tags,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Folder,
  Hash,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoCategories, demoTags } from '@/data/content/demoData';
import { containerVariants, itemVariants } from '@/components/content/shared';

// Color options for categories
const colorOptions = [
  { name: 'blue', class: 'bg-blue-500' },
  { name: 'emerald', class: 'bg-emerald-500' },
  { name: 'violet', class: 'bg-violet-500' },
  { name: 'amber', class: 'bg-amber-500' },
  { name: 'rose', class: 'bg-rose-500' },
  { name: 'cyan', class: 'bg-cyan-500' },
];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'tags'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');

  const filteredCategories = demoCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTags = demoTags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNew = () => {
    if (!newItemName.trim()) return;
    // Would add to state here
    setNewItemName('');
    setIsAddingNew(false);
  };

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
            Categories & Tags
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            Organize your content with categories and tags
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddingNew(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary-500/25"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'categories' ? 'Category' : 'Tag'}
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
            activeTab === 'categories'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          )}
        >
          <Folder className="w-4 h-4" />
          Categories
          <span className="px-2 py-0.5 bg-white/20 dark:bg-neutral-900/20 rounded-full text-xs">
            {demoCategories.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
            activeTab === 'tags'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
          )}
        >
          <Hash className="w-4 h-4" />
          Tags
          <span className="px-2 py-0.5 bg-white/20 dark:bg-neutral-900/20 rounded-full text-xs">
            {demoTags.length}
          </span>
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-xl',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-800',
            'text-sm text-neutral-900 dark:text-white',
            'placeholder:text-neutral-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
          )}
        />
      </motion.div>

      {/* Add New Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'p-5 rounded-2xl',
                'bg-white dark:bg-neutral-900',
                'border border-primary-200 dark:border-primary-800'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Add New {activeTab === 'categories' ? 'Category' : 'Tag'}
                </h3>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Enter ${activeTab === 'categories' ? 'category' : 'tag'} name...`}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-sm text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                </div>

                {activeTab === 'categories' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Color
                    </label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={cn(
                            'w-8 h-8 rounded-lg transition-all',
                            color.class,
                            selectedColor === color.name
                              ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white'
                              : 'opacity-60 hover:opacity-100'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-xl text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Create
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div variants={itemVariants}>
        {activeTab === 'categories' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  whileHover={{ y: -4 }}
                  className={cn(
                    'p-5 rounded-2xl',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200/60 dark:border-neutral-800/60',
                    'hover:shadow-lg transition-all duration-300',
                    'group'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        `bg-${category.color}-500`
                      )}
                      style={{
                        backgroundColor:
                          category.color === 'blue'
                            ? '#3b82f6'
                            : category.color === 'emerald'
                            ? '#10b981'
                            : category.color === 'violet'
                            ? '#8b5cf6'
                            : category.color === 'amber'
                            ? '#f59e0b'
                            : '#f43f5e',
                      }}
                    >
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{category.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {category.postCount} posts
                    </span>
                    <button className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                      View posts
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div
            className={cn(
              'p-5 rounded-2xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200/60 dark:border-neutral-800/60'
            )}
          >
            {/* Tag Cloud */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                Tag Cloud
              </h3>
              <div className="flex flex-wrap gap-2">
                {filteredTags.map((tag, index) => {
                  const size = tag.postCount > 15 ? 'large' : tag.postCount > 10 ? 'medium' : 'small';
                  return (
                    <motion.button
                      key={tag.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={{ scale: 1.05 }}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors',
                        'bg-neutral-100 dark:bg-neutral-800',
                        'text-neutral-700 dark:text-neutral-300',
                        'hover:bg-neutral-200 dark:hover:bg-neutral-700',
                        size === 'large' && 'text-base font-semibold',
                        size === 'medium' && 'text-sm font-medium',
                        size === 'small' && 'text-xs'
                      )}
                    >
                      <Hash className={cn('text-neutral-400', size === 'large' ? 'w-4 h-4' : 'w-3 h-3')} />
                      {tag.name}
                      <span className="text-neutral-400">({tag.postCount})</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Tag List */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
                All Tags
              </h3>
              <div className="space-y-2">
                {filteredTags.map((tag, index) => (
                  <motion.div
                    key={tag.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{tag.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">/{tag.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {tag.postCount} posts
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
