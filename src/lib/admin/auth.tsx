'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Demo user for testing without Supabase
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@lightbrands.dev',
  name: 'Demo Admin',
  role: 'admin' as const,
  avatar: null,
};

const DEMO_CREDENTIALS = {
  email: 'demo@lightbrands.dev',
  password: 'demo1234',
};

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'user';
  avatar: string | null;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-supabase-url'
  );
};

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for demo session first
        const demoSession = localStorage.getItem('admin_demo_session');
        if (demoSession === 'true') {
          setUser(DEMO_USER);
          setIsDemo(true);
          setIsLoading(false);
          return;
        }

        // If Supabase is configured, check real session
        if (isSupabaseConfigured()) {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();

          if (supabaseUser) {
            // Get profile data
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, role, avatar_url')
              .eq('id', supabaseUser.id)
              .single();

            if (profile?.role === 'admin' || profile?.role === 'editor') {
              setUser({
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: profile.full_name || supabaseUser.email || '',
                role: profile.role,
                avatar: profile.avatar_url,
              });
            }
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Check demo credentials first
      if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        localStorage.setItem('admin_demo_session', 'true');
        setUser(DEMO_USER);
        setIsDemo(true);
        setIsLoading(false);
        return { success: true };
      }

      // If Supabase is configured, try real login
      if (isSupabaseConfigured()) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return { success: false, error: authError.message };
        }

        if (data.user) {
          // Check if user is admin/editor
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, avatar_url')
            .eq('id', data.user.id)
            .single();

          if (profile?.role !== 'admin' && profile?.role !== 'editor') {
            await supabase.auth.signOut();
            const errorMsg = 'Access denied. Admin privileges required.';
            setError(errorMsg);
            setIsLoading(false);
            return { success: false, error: errorMsg };
          }

          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: profile.full_name || data.user.email || '',
            role: profile.role,
            avatar: profile.avatar_url,
          });
          setIsLoading(false);
          return { success: true };
        }
      }

      // Invalid credentials
      const errorMsg = 'Invalid email or password';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = 'Login failed. Please try again.';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      // Clear demo session
      localStorage.removeItem('admin_demo_session');

      // If Supabase is configured, sign out
      if (isSupabaseConfigured() && !isDemo) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.signOut();
      }

      setUser(null);
      setIsDemo(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isDemo]);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isDemo,
        error,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }

  return context;
}

export { DEMO_CREDENTIALS };
