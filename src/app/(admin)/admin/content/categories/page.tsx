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
import { colors, statusColors } from '@/lib/design/tokens';

// Color options for categories - using design tokens
const colorOptions = [
  { name: 'primary', class: colors.primary.solid, label: 'Primary' },
  { name: 'secondary', class: colors.secondary.solid, label: 'Secondary' },
  { name: 'neutral', class: 'bg-neutral-500 dark:bg-neutral-400', label: 'Neutral' },
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
      className="admin-section"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Categories & Tags
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Organize your content with categories and tags
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsAddingNew(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
            'bg-primary text-primary-foreground',
            'hover:bg-primary-hover transition-colors'
          )}
          aria-label={`Add new ${activeTab === 'categories' ? 'category' : 'tag'}`}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add {activeTab === 'categories' ? 'Category' : 'Tag'}
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2 mb-6" role="tablist" aria-label="Content organization">
        <button
          onClick={() => setActiveTab('categories')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
            activeTab === 'categories'
              ? 'bg-primary text-primary-foreground'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
          role="tab"
          aria-selected={activeTab === 'categories'}
          aria-controls="categories-panel"
        >
          <Folder className="w-4 h-4" aria-hidden="true" />
          Categories
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 dark:bg-neutral-900/20 tabular-nums">
            {demoCategories.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
            activeTab === 'tags'
              ? 'bg-primary text-primary-foreground'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
          role="tab"
          aria-selected={activeTab === 'tags'}
          aria-controls="tags-panel"
        >
          <Hash className="w-4 h-4" aria-hidden="true" />
          Tags
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 dark:bg-neutral-900/20 tabular-nums">
            {demoTags.length}
          </span>
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative flex-1 max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
            'bg-white dark:bg-neutral-900',
            'border border-neutral-200 dark:border-neutral-800',
            'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
          )}
          aria-label={`Search ${activeTab}`}
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
            <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-primary/30 dark:border-primary/20 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Add New {activeTab === 'categories' ? 'Category' : 'Tag'}
                </h3>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Close form"
                >
                  <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="new-item-name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Name
                  </label>
                  <input
                    id="new-item-name"
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Enter ${activeTab === 'categories' ? 'category' : 'tag'} name...`}
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm',
                      'bg-white dark:bg-neutral-900',
                      'border border-neutral-200 dark:border-neutral-800',
                      'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    )}
                  />
                </div>

                {activeTab === 'categories' && (
                  <div className="flex flex-col gap-2">
                    <label id="color-label" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Color
                    </label>
                    <div className="flex gap-2" role="radiogroup" aria-labelledby="color-label">
                      {colorOptions.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color.name)}
                          className={cn(
                            'w-10 h-10 rounded-lg transition-all',
                            color.class,
                            selectedColor === color.name
                              ? 'ring-2 ring-offset-2 ring-primary dark:ring-primary'
                              : 'opacity-60 hover:opacity-100'
                          )}
                          role="radio"
                          aria-checked={selectedColor === color.name}
                          aria-label={color.label}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsAddingNew(false)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium',
                    'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
                    'hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors'
                  )}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddNew}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium',
                    'bg-primary text-primary-foreground',
                    'hover:bg-primary-hover transition-colors'
                  )}
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                  Create
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div variants={itemVariants}>
        {activeTab === 'categories' ? (
          <div id="categories-panel" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="tabpanel" aria-labelledby="categories-tab">
            <AnimatePresence mode="popLayout">
              {filteredCategories.map((category, index) => (
                <motion.article
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  whileHover={{ y: -4 }}
                  className={cn(
                    'p-5 rounded-xl border transition-all duration-300 group',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60',
                    'hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        category.color === 'gold' || category.color === 'primary'
                          ? colors.primary.solid
                          : category.color === 'slate' || category.color === 'secondary'
                          ? colors.secondary.solid
                          : 'bg-neutral-500 dark:bg-neutral-400'
                      )}
                      aria-hidden="true"
                    >
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                          colors.primary.text
                        )}
                        aria-label={`Edit ${category.name}`}
                      >
                        <Edit className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button 
                        className={cn(
                          'p-1.5 rounded-lg transition-colors',
                          colors.error.text,
                          colors.error.bg.replace('bg-', 'hover:bg-')
                        )}
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">{category.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      {category.postCount} posts
                    </span>
                    <button className={cn('text-xs font-medium hover:underline flex items-center gap-1', colors.primary.text)}>
                      View posts
                      <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div
            id="tags-panel"
            className={cn(
              'p-5 rounded-xl border',
              'bg-white dark:bg-neutral-900',
              'border-neutral-200/60 dark:border-neutral-800/60'
            )}
            role="tabpanel"
            aria-labelledby="tags-tab"
          >
            {/* Tag Cloud */}
            <div className="mb-6" role="region" aria-labelledby="tag-cloud-heading">
              <h3 id="tag-cloud-heading" className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
                Tag Cloud
              </h3>
              <div className="flex flex-wrap gap-2" role="list">
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
                        'border border-neutral-200/50 dark:border-neutral-700/50',
                        size === 'large' && 'text-base font-semibold',
                        size === 'medium' && 'text-sm font-medium',
                        size === 'small' && 'text-xs'
                      )}
                      role="listitem"
                    >
                      <Hash className={cn('text-neutral-400', size === 'large' ? 'w-4 h-4' : 'w-3 h-3')} aria-hidden="true" />
                      {tag.name}
                      <span className="text-neutral-400 tabular-nums">({tag.postCount})</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Tag List */}
            <div role="region" aria-labelledby="all-tags-heading">
              <h3 id="all-tags-heading" className="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
                All Tags
              </h3>
              <div className="space-y-2" role="list">
                {filteredTags.map((tag, index) => (
                  <motion.li
                    key={tag.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-all group mb-2',
                      'bg-white dark:bg-neutral-900',
                      'border-neutral-200/60 dark:border-neutral-800/60',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                      'hover:border-neutral-300 dark:hover:border-neutral-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center" aria-hidden="true">
                        <Hash className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">{tag.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">/{tag.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {tag.postCount} posts
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                            colors.primary.text
                          )}
                          aria-label={`Edit ${tag.name}`}
                        >
                          <Edit className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button 
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            colors.error.text,
                            colors.error.bg.replace('bg-', 'hover:bg-')
                          )}
                          aria-label={`Delete ${tag.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
