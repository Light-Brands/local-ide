'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Image,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  X,
  Terminal,
  ListTodo,
  Bug,
  Bot,
  Code2,
  ChevronDown,
  Sparkles,
  Layers,
  Tags,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

interface AdminSidebarProps {
  isOpen: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  isDemo: boolean;
}

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

const contentMediaItems = [
  { label: 'Overview', href: '/admin/content', icon: Layers },
  { label: 'Posts', href: '/admin/content/posts', icon: FileText },
  { label: 'Media Library', href: '/admin/content/media', icon: Image },
  { label: 'AI Generator', href: '/admin/content/generator', icon: Sparkles },
  { label: 'Batch Queue', href: '/admin/content/batch', icon: FolderOpen },
  { label: 'Categories', href: '/admin/content/categories', icon: Tags },
];

const devToolsItems = [
  { label: 'Dev Dashboard', href: '/admin/dev', icon: Terminal },
  { label: 'Tracker', href: '/admin/dev/tracker', icon: ListTodo },
  { label: 'Dev Feedback', href: '/admin/dev/feedback', icon: Bug },
  { label: 'AutoDev', href: '/admin/dev/autodev', icon: Bot },
];

export function AdminSidebar({
  isOpen,
  isMobileOpen,
  onMobileClose,
  isDemo,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [devToolsExpanded, setDevToolsExpanded] = useState(true);
  const [contentMediaExpanded, setContentMediaExpanded] = useState(true);

  // Auto-expand sections when on their routes
  useEffect(() => {
    if (pathname.startsWith('/admin/dev')) {
      setDevToolsExpanded(true);
    }
    if (pathname.startsWith('/admin/content')) {
      setContentMediaExpanded(true);
    }
  }, [pathname]);

  const NavItem = ({
    item,
    showLabel,
    onClick,
  }: {
    item: (typeof navItems)[0];
    showLabel: boolean;
    onClick?: () => void;
  }) => {
    const isActive =
      pathname === item.href ||
      (item.href !== '/admin' && pathname.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
          'transition-all duration-200',
          showLabel ? 'justify-start' : 'justify-center',
          isActive
            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'
        )}
      >
        {/* Active indicator dot */}
        {isActive && !showLabel && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary-500 rounded-full"
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}

        <Icon
          className={cn(
            'w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200',
            !isActive && 'group-hover:scale-110'
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />

        {showLabel && (
          <span className="font-medium text-[13px] tracking-tight">{item.label}</span>
        )}

        {/* Tooltip when collapsed */}
        {!showLabel && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-[100] shadow-lg">
            {item.label}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-neutral-900 dark:bg-white rotate-45" />
          </div>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full',
          'bg-white dark:bg-neutral-900',
          'border-r border-neutral-200/80 dark:border-neutral-800',
          'transition-all duration-300 ease-out',
          'hidden lg:flex lg:flex-col',
          'z-40',
          isOpen ? 'w-56' : 'w-[68px]'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'border-b border-neutral-200/80 dark:border-neutral-800',
            isOpen ? 'px-4 py-4' : 'py-4'
          )}
        >
          <div className={cn('flex items-center', isOpen ? 'gap-3' : 'justify-center')}>
            <Logo
              href="/admin"
              size="md"
              className={cn('transition-all duration-200', !isOpen && 'justify-center')}
            />
            {isOpen && (
              <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-neutral-400 dark:text-neutral-500 transition-colors duration-200">
                STUDIO
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto admin-scrollbar">
          {/* Dashboard */}
          <NavItem item={navItems[0]} showLabel={isOpen} />

          {/* Content & Media Section */}
          <div className="space-y-1">
            {/* Section Header */}
            <button
              onClick={() => setContentMediaExpanded(!contentMediaExpanded)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl',
                'text-neutral-500 dark:text-neutral-400',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'transition-colors duration-200',
                isOpen ? 'justify-between' : 'justify-center'
              )}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                {isOpen && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Content
                  </span>
                )}
              </div>
              {isOpen && (
                <motion.div
                  animate={{ rotate: contentMediaExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              )}
            </button>

            {/* Content & Media Items */}
            <AnimatePresence initial={false}>
              {(contentMediaExpanded || !isOpen) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1">
                    {contentMediaItems.map((item) => (
                      <NavItem key={item.href} item={item} showLabel={isOpen} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Other nav items */}
          {navItems.slice(1).map((item) => (
            <NavItem key={item.href} item={item} showLabel={isOpen} />
          ))}

          {/* Divider */}
          <div className="my-3 mx-2 border-t border-neutral-200/60 dark:border-neutral-800" />

          {/* Developer Tools Section */}
          <div className="space-y-1">
            {/* Section Header */}
            <button
              onClick={() => setDevToolsExpanded(!devToolsExpanded)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-xl',
                'text-neutral-500 dark:text-neutral-400',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                'transition-colors duration-200',
                isOpen ? 'justify-between' : 'justify-center'
              )}
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                {isOpen && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Developer
                  </span>
                )}
              </div>
              {isOpen && (
                <motion.div
                  animate={{ rotate: devToolsExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
              )}
            </button>

            {/* Dev Tools Items */}
            <AnimatePresence initial={false}>
              {(devToolsExpanded || !isOpen) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1">
                    {devToolsItems.map((item) => (
                      <NavItem key={item.href} item={item} showLabel={isOpen} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Demo badge */}
        {isDemo && (
          <div className="p-2.5 border-t border-neutral-200/80 dark:border-neutral-800">
            <div
              className={cn(
                'rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50',
                'transition-all duration-200',
                isOpen ? 'px-3 py-2' : 'py-2'
              )}
            >
              {isOpen ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                    Demo
                  </span>
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-sm z-50 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed top-0 left-0 h-full w-72',
              'bg-white dark:bg-neutral-900',
              'flex flex-col',
              'z-50 lg:hidden',
              'shadow-2xl shadow-neutral-950/20'
            )}
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <Logo
                  href="/admin"
                  size="md"
                  onClick={onMobileClose}
                />
                <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-neutral-400 dark:text-neutral-500 transition-colors duration-200">
                  STUDIO
                </span>
              </div>
              <button
                onClick={onMobileClose}
                className="p-2 -mr-2 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {/* Dashboard */}
              <NavItem item={navItems[0]} showLabel={true} onClick={onMobileClose} />

              {/* Content & Media Section */}
              <div className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => setContentMediaExpanded(!contentMediaExpanded)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl',
                    'text-neutral-500 dark:text-neutral-400',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'transition-colors duration-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      Content & Media
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: contentMediaExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                {/* Content & Media Items */}
                <AnimatePresence initial={false}>
                  {contentMediaExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1">
                        {contentMediaItems.map((item) => (
                          <NavItem
                            key={item.href}
                            item={item}
                            showLabel={true}
                            onClick={onMobileClose}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Other nav items */}
              {navItems.slice(1).map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  showLabel={true}
                  onClick={onMobileClose}
                />
              ))}

              {/* Divider */}
              <div className="my-3 mx-2 border-t border-neutral-200/60 dark:border-neutral-800" />

              {/* Developer Tools Section */}
              <div className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => setDevToolsExpanded(!devToolsExpanded)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl',
                    'text-neutral-500 dark:text-neutral-400',
                    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    'transition-colors duration-200'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Code2 className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                      Developer Tools
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: devToolsExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                {/* Dev Tools Items */}
                <AnimatePresence initial={false}>
                  {devToolsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1">
                        {devToolsItems.map((item) => (
                          <NavItem
                            key={item.href}
                            item={item}
                            showLabel={true}
                            onClick={onMobileClose}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Demo badge */}
            {isDemo && (
              <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800">
                <div className="px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                      Demo Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1">
                    Connect Supabase for full features
                  </p>
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
