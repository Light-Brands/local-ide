'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { Logo } from './Logo';

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
}

interface NavigationProps {
  logo?: React.ReactNode;
  items?: NavItem[];
  cta?: { label: string; href: string };
  transparent?: boolean;
}

const defaultItems: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  {
    label: 'Resources',
    href: '#',
    children: [
      { label: 'Documentation', href: '/docs', description: 'Learn how to integrate' },
      { label: 'Blog', href: '/blog', description: 'Latest news and updates' },
      { label: 'Support', href: '/support', description: 'Get help from our team' },
    ],
  },
  { label: 'About', href: '#about' },
];

export function Navigation({
  logo,
  items = defaultItems,
  cta = { label: 'Get Started', href: '#' },
  transparent = false,
}: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { resolvedTheme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Refined: More nuanced background transitions
  const navBackground = transparent && !isScrolled
    ? 'bg-transparent'
    : cn(
        'bg-white/70 dark:bg-neutral-950/70',
        'backdrop-blur-xl backdrop-saturate-150',
        'border-b border-neutral-200/40 dark:border-neutral-800/40',
        'shadow-sm shadow-neutral-900/[0.03]'
      );

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'transition-all duration-500 ease-out',
          navBackground
        )}
      >
        <nav className="container-premium">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {logo || <Logo size="md" className="z-10" />}
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg',
                      'text-neutral-600 dark:text-neutral-400',
                      'hover:text-neutral-900 dark:hover:text-white',
                      'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60',
                      'transition-all duration-200 ease-out'
                    )}
                  >
                    <span className="relative">
                      {item.label}
                      {/* Refined: Subtle underline on hover */}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] bg-gradient-to-r from-primary-500 to-secondary-500 group-hover:w-full transition-all duration-300 ease-out rounded-full" />
                    </span>
                    {item.children && (
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 transition-transform duration-200',
                          activeDropdown === item.label && 'rotate-180'
                        )}
                      />
                    )}
                  </Link>

                  {/* Dropdown - Refined with better animation */}
                  <AnimatePresence>
                    {item.children && activeDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          'absolute top-full left-0 mt-2 w-64 p-1.5',
                          'bg-white/95 dark:bg-neutral-900/95',
                          'backdrop-blur-xl',
                          'border border-neutral-200/60 dark:border-neutral-800/60',
                          'rounded-xl shadow-xl shadow-neutral-900/[0.08]',
                          'origin-top-left'
                        )}
                      >
                        {item.children.map((child, index) => (
                          <motion.div
                            key={child.label}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                          >
                            <Link
                              href={child.href}
                              className={cn(
                                'block px-3.5 py-2.5 rounded-lg',
                                'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60',
                                'transition-colors duration-150'
                              )}
                            >
                              <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                                {child.label}
                              </span>
                              {child.description && (
                                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                                  {child.description}
                                </span>
                              )}
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle - Refined with subtle animation */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'relative p-2.5 rounded-xl',
                  'text-neutral-500 dark:text-neutral-400',
                  'hover:text-neutral-700 dark:hover:text-neutral-200',
                  'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60',
                  'transition-colors duration-200'
                )}
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={resolvedTheme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {resolvedTheme === 'dark' ? (
                      <Sun className="w-[18px] h-[18px]" />
                    ) : (
                      <Moon className="w-[18px] h-[18px]" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              {/* CTA Button - Refined with premium hover */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  href={cta.href}
                  className={cn(
                    'hidden sm:flex items-center gap-2 px-5 py-2.5',
                    'bg-neutral-900 dark:bg-white',
                    'text-white dark:text-neutral-900',
                    'text-sm font-medium rounded-xl',
                    'hover:bg-neutral-800 dark:hover:bg-neutral-50',
                    'shadow-sm hover:shadow-md',
                    'transition-all duration-200'
                  )}
                >
                  {cta.label}
                </Link>
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'lg:hidden p-2.5 rounded-xl',
                  'text-neutral-600 dark:text-neutral-400',
                  'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60',
                  'transition-colors duration-200'
                )}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isMobileMenuOpen ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Menu className="w-5 h-5" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu - Refined with premium animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 lg:hidden',
                'bg-white/95 dark:bg-neutral-950/95',
                'backdrop-blur-xl',
                'border-l border-neutral-200/50 dark:border-neutral-800/50',
                'overflow-y-auto'
              )}
            >
              <div className="p-6">
                {/* Close Button */}
                <div className="flex justify-end mb-6">
                  <motion.button
                    onClick={() => setIsMobileMenuOpen(false)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'p-2.5 rounded-xl',
                      'text-neutral-500 dark:text-neutral-400',
                      'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60',
                      'transition-colors duration-200'
                    )}
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Mobile Nav Items */}
                <nav className="space-y-1">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.3 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'block px-4 py-3 rounded-xl',
                          'text-lg font-medium',
                          'text-neutral-900 dark:text-white',
                          'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60',
                          'active:bg-neutral-200/80 dark:active:bg-neutral-700/60',
                          'transition-colors duration-150'
                        )}
                      >
                        {item.label}
                      </Link>

                      {item.children && (
                        <div className="ml-4 mt-1 space-y-0.5">
                          {item.children.map((child, childIndex) => (
                            <motion.div
                              key={child.label}
                              initial={{ opacity: 0, x: 16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (index * 0.04) + (childIndex * 0.02), duration: 0.25 }}
                            >
                              <Link
                                href={child.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'block px-4 py-2 rounded-lg',
                                  'text-sm text-neutral-600 dark:text-neutral-400',
                                  'hover:text-neutral-900 dark:hover:text-white',
                                  'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40',
                                  'transition-colors duration-150'
                                )}
                              >
                                {child.label}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </nav>

                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.35 }}
                  className="mt-8"
                >
                  <Link
                    href={cta.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'block w-full px-6 py-3.5 text-center',
                      'bg-neutral-900 dark:bg-white',
                      'text-white dark:text-neutral-900',
                      'font-medium rounded-xl',
                      'hover:bg-neutral-800 dark:hover:bg-neutral-50',
                      'active:bg-neutral-700 dark:active:bg-neutral-200',
                      'shadow-sm',
                      'transition-colors duration-150'
                    )}
                  >
                    {cta.label}
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navigation;
