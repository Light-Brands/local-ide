'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  Moon,
  Sun,
  ExternalLink,
  X,
  Command,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/lib/admin/auth';
import { useTheme } from '@/lib/theme';

interface AdminHeaderProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  onMobileSidebarToggle: () => void;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
  };
  isDemo: boolean;
}

export function AdminHeader({
  sidebarOpen,
  onSidebarToggle,
  onMobileSidebarToggle,
  user,
}: AdminHeaderProps) {
  const router = useRouter();
  const { logout } = useAdminAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
      <div className="h-16 px-4 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-1">
          {/* Mobile menu button */}
          <button
            onClick={onMobileSidebarToggle}
            className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={onSidebarToggle}
            className="hidden lg:flex p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            ) : (
              <PanelLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            )}
          </button>

          {/* Search - Desktop */}
          <div className="hidden md:flex items-center ml-2">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 transition-colors group-focus-within:text-primary-500" />
              <input
                type="search"
                placeholder="Search..."
                className={cn(
                  'w-64 pl-9 pr-16 py-2 rounded-xl',
                  'bg-neutral-100 dark:bg-neutral-800',
                  'border border-transparent',
                  'text-sm text-neutral-900 dark:text-white',
                  'placeholder:text-neutral-500',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                  'focus:bg-white dark:focus:bg-neutral-900',
                  'transition-all duration-200'
                )}
              />
              {/* Keyboard shortcut hint */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-neutral-200/80 dark:bg-neutral-700/80 pointer-events-none">
                <Command className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">K</span>
              </div>
            </div>
          </div>

          {/* Search - Mobile */}
          <button
            onClick={() => setShowSearch(true)}
            className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 md:hidden transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Open IDE link */}
          <a
            href="/ide"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden lg:inline">Open IDE</span>
          </a>

          {/* View site link - Desktop only */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden lg:inline">View Site</span>
          </a>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            ) : (
              <Moon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors group"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-neutral-700 dark:text-neutral-300 transition-transform group-hover:scale-110 group-active:scale-95" />
            <motion.span
              className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </button>

          {/* User menu */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={cn(
                'flex items-center gap-2.5 p-1.5 rounded-xl transition-colors',
                showUserMenu
                  ? 'bg-neutral-100 dark:bg-neutral-800'
                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
              )}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="hidden md:block text-left pr-1">
                <p className="text-sm font-medium text-neutral-900 dark:text-white leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-500 capitalize leading-tight">
                  {user.role}
                </p>
              </div>
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={cn(
                    'absolute right-0 mt-2 w-64',
                    'bg-white dark:bg-neutral-900',
                    'border border-neutral-200 dark:border-neutral-800',
                    'rounded-2xl shadow-xl overflow-hidden',
                    'z-50'
                  )}
                >
                  {/* User info */}
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                          <span className="text-base font-semibold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-sm text-neutral-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/settings');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/admin/settings');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="p-2 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search..."
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-xl',
                      'bg-neutral-100 dark:bg-neutral-800',
                      'text-base text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-500',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500'
                    )}
                  />
                </div>
                <button
                  onClick={() => setShowSearch(false)}
                  className="p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
