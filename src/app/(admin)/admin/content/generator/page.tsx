'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  FileText,
  MessageSquare,
  Hash,
  Image,
  RefreshCw,
  Copy,
  Check,
  Clock,
  Zap,
  ChevronRight,
  Settings,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoAIGenerations } from '@/data/content/demoData';
import { containerVariants, itemVariants, ContentStatusBadge } from '@/components/content/shared';
import { colors, gradients } from '@/lib/design/tokens';

// Generation types
const generationTypes = [
  {
    id: 'post',
    label: 'Blog Post',
    description: 'Generate a full blog post from a topic or outline',
    icon: FileText,
    gradient: gradients.primary,
  },
  {
    id: 'social',
    label: 'Social Media',
    description: 'Create posts for Twitter, LinkedIn, or Instagram',
    icon: MessageSquare,
    gradient: gradients.secondary,
  },
  {
    id: 'meta',
    label: 'Meta Description',
    description: 'Generate SEO-optimized meta descriptions',
    icon: Hash,
    gradient: gradients.success,
  },
  {
    id: 'alt-text',
    label: 'Image Alt Text',
    description: 'Create accessible alt text for images',
    icon: Image,
    gradient: gradients.brand,
  },
  {
    id: 'rewrite',
    label: 'Rewrite',
    description: 'Rewrite or improve existing content',
    icon: RefreshCw,
    gradient: gradients.secondary,
  },
];

// Tone options
const toneOptions = ['Professional', 'Casual', 'Technical', 'Friendly', 'Authoritative'];

// Prompt templates
const promptTemplates = [
  { label: 'Product announcement', prompt: 'Write a blog post announcing a new feature that...' },
  { label: 'How-to guide', prompt: 'Create a step-by-step guide explaining how to...' },
  { label: 'Industry insights', prompt: 'Write an informative article about trends in...' },
  { label: 'Case study', prompt: 'Write a case study about how our customer achieved...' },
];

export default function AIGeneratorPage() {
  const [selectedType, setSelectedType] = useState('post');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedContent(null);

    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setGeneratedContent(
      `# Generated Content\n\nBased on your prompt "${prompt.substring(0, 50)}...", here's the generated content:\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\n## Key Points\n\n1. First important insight about the topic\n2. Second valuable perspective to consider\n3. Third actionable recommendation\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
    );
    setIsGenerating(false);
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedTypeConfig = generationTypes.find((t) => t.id === selectedType);

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
            AI Content Generator
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Generate high-quality content with AI assistance
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowHistory(!showHistory)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
            showHistory
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : cn(
                  'bg-white dark:bg-neutral-900',
                  'border border-neutral-200 dark:border-neutral-800',
                  'text-neutral-700 dark:text-neutral-300',
                  'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                )
          )}
          aria-pressed={showHistory}
          aria-label="Toggle generation history"
        >
          <History className="w-4 h-4" aria-hidden="true" />
          History
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left Panel - Configuration */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          {/* Generation Type Selection */}
          <div className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="content-type-heading">
            <h2 id="content-type-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Content Type
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {generationTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;

                return (
                  <motion.button
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl transition-all border',
                      isSelected
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                        : cn(
                            'bg-white dark:bg-neutral-900',
                            'border-neutral-200/60 dark:border-neutral-800/60',
                            'text-neutral-600 dark:text-neutral-400',
                            'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          )
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        isSelected
                          ? 'bg-white/20 dark:bg-neutral-900/20'
                          : cn(type.gradient, 'text-white')
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Prompt Input */}
          <div className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="prompt-heading">
            <div className="flex items-center justify-between mb-4">
              <h2 id="prompt-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                Your Prompt
              </h2>
              <div className="flex items-center gap-2">
                {promptTemplates.map((template) => (
                  <button
                    key={template.label}
                    onClick={() => setPrompt(template.prompt)}
                    className="px-2 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="ai-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe what you want to generate... (${selectedTypeConfig?.description})`}
              rows={5}
              className={cn(
                'w-full px-4 py-3 rounded-xl text-sm resize-none',
                'bg-white dark:bg-neutral-900',
                'border border-neutral-200 dark:border-neutral-800',
                'text-neutral-900 dark:text-white',
                'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
              )}
              aria-describedby="prompt-description"
            />

            {/* Tone & Settings */}
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <label htmlFor="tone-select" className="text-sm text-neutral-500 dark:text-neutral-400">Tone:</label>
                <select
                  id="tone-select"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200 dark:border-neutral-800',
                    'text-neutral-900 dark:text-white',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  )}
                >
                  {toneOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1" />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary-hover',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-busy={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    Generate
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Generated Content */}
          <AnimatePresence>
            {generatedContent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  'p-5 rounded-xl border',
                  'bg-white dark:bg-neutral-900',
                  'border-neutral-200/60 dark:border-neutral-800/60'
                )}
                role="region"
                aria-labelledby="generated-content-heading"
                aria-live="polite"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 id="generated-content-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider">
                    Generated Content
                  </h2>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerate}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      aria-label="Regenerate content"
                    >
                      <RefreshCw className="w-4 h-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopy}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        copied
                          ? cn(colors.success.text, colors.success.bg)
                          : cn(
                              'bg-white dark:bg-neutral-900',
                              'border border-neutral-200 dark:border-neutral-800',
                              'text-neutral-700 dark:text-neutral-300',
                              'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                            )
                      )}
                      aria-label={copied ? 'Copied to clipboard' : 'Copy content'}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" aria-hidden="true" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" aria-hidden="true" />
                          Copy
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                <div
                  className={cn(
                    'p-4 rounded-xl border',
                    'bg-neutral-50 dark:bg-neutral-800/50',
                    'border-neutral-200/50 dark:border-neutral-700/50',
                    'prose prose-sm dark:prose-invert max-w-none'
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700 dark:text-neutral-300">
                    {generatedContent}
                  </pre>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900',
                      'hover:opacity-90'
                    )}
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    Save as Draft
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      'bg-white dark:bg-neutral-900',
                      'border border-neutral-200 dark:border-neutral-800',
                      'text-neutral-700 dark:text-neutral-300',
                      'hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    )}
                  >
                    Edit & Refine
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Panel - History & Tips */}
        <motion.div variants={itemVariants} className="flex flex-col gap-6">
          {/* Quick Stats */}
          <div className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              This Month
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={cn('text-center p-3 rounded-lg border', 'bg-neutral-50 dark:bg-neutral-800/50', 'border-neutral-200/50 dark:border-neutral-700/50')}>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{demoAIGenerations.length}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Generations</p>
              </div>
              <div className={cn('text-center p-3 rounded-lg border', 'bg-neutral-50 dark:bg-neutral-800/50', 'border-neutral-200/50 dark:border-neutral-700/50')}>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">2.4K</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Words</p>
              </div>
            </div>
          </div>

          {/* Recent Generations */}
          <div className={cn(
            'p-5 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} role="region" aria-labelledby="recent-generations-heading">
            <h2 id="recent-generations-heading" className="text-xs font-semibold text-neutral-900 dark:text-white uppercase tracking-wider mb-4">
              Recent Generations
            </h2>
            <div className="space-y-3" role="list">
              {demoAIGenerations.map((gen, index) => (
                <motion.div
                  key={gen.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-colors',
                    'bg-neutral-50 dark:bg-neutral-800/50',
                    'border-neutral-200/50 dark:border-neutral-700/50',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                      {gen.prompt.substring(0, 35)}...
                    </p>
                    <ContentStatusBadge
                      status={gen.status === 'complete' ? 'published' : gen.status === 'processing' ? 'processing' : 'draft'}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="capitalize">{gen.type}</span>
                    <span aria-hidden="true">&middot;</span>
                    <time className="flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div
            className={cn(
              'p-5 rounded-xl border',
              colors.primary.bg,
              colors.primary.border
            )}
            role="complementary"
            aria-labelledby="tips-heading"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className={cn('w-4 h-4', colors.primary.text)} aria-hidden="true" />
              <h2 id="tips-heading" className={cn('text-sm font-semibold', colors.primary.text)}>Pro Tips</h2>
            </div>
            <ul className="space-y-2 text-sm" role="list" style={{ color: 'inherit' }}>
              <li className="flex items-start gap-2">
                <ChevronRight className={cn('w-4 h-4 flex-shrink-0 mt-0.5', colors.primary.text)} aria-hidden="true" />
                Be specific about your target audience
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={cn('w-4 h-4 flex-shrink-0 mt-0.5', colors.primary.text)} aria-hidden="true" />
                Include key points you want covered
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className={cn('w-4 h-4 flex-shrink-0 mt-0.5', colors.primary.text)} aria-hidden="true" />
                Mention the desired tone and style
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
