'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAdminAuth } from '@/lib/admin/auth';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import './globals.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isDemo } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Skip auth check for login page
  const isLoginPage = pathname === '/admin/login';

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [user, isLoading, isLoginPage, router]);

  // Show loading state
  if (isLoading && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Logo pulse */}
            <div className="animate-pulse">
              <Logo size="lg" />
            </div>
            {/* Spinner ring */}
            <div className="absolute inset-0 -m-1 flex items-center justify-center">
              <Loader2 className="w-14 h-14 animate-spin text-primary-500/30" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-neutral-500 mt-0.5">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Login page - no layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Protected pages - full layout
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        isDemo={isDemo}
      />

      {/* Main content wrapper */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300 ease-out',
          // Desktop: offset by sidebar width
          sidebarOpen ? 'lg:ml-60' : 'lg:ml-[72px]'
        )}
      >
        {/* Header */}
        <AdminHeader
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          onMobileSidebarToggle={() => setMobileSidebarOpen(true)}
          user={user}
          isDemo={isDemo}
        />

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8 admin-scrollbar">
          {/* Demo mode banner */}
          {isDemo && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200/80 dark:border-primary-800/50 flex items-start gap-3 shadow-sm">
              <div className="relative mt-1 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary-600" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary-600 animate-ping opacity-75" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">
                  Demo Mode Active
                </p>
                <p className="text-xs text-primary-700/80 dark:text-primary-300/80 mt-0.5">
                  You&apos;re viewing sample data. Connect Supabase to manage real content.
                </p>
              </div>
              <a
                href="/setup"
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-800/30 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors flex-shrink-0"
              >
                Setup
              </a>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
