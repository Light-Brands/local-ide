'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth, DEMO_CREDENTIALS } from '@/lib/admin/auth';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await login(email, password);

    if (result.success) {
      router.push('/admin');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const fillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  };

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-900">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500" />

        {/* Animated circles */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.2, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-white/10"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full bg-white/10"
          />
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-white/5"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Logo
              href="/"
              size="lg"
              className="[&_img]:brightness-0 [&_img]:invert"
            />
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4 tracking-tight">
              Welcome to your
              <br />
              <span className="text-white/80">admin dashboard</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Manage your content, track analytics, and grow your audience — all in one place.
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/60">
            <span>© {new Date().getFullYear()} Light Brands</span>
            <span>•</span>
            <a href="/" className="hover:text-white transition-colors">Back to site</a>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Logo size="lg" className="justify-center mb-4" />
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Sign in
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Demo credentials hint */}
          <motion.button
            type="button"
            onClick={fillDemoCredentials}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              'w-full mb-6 p-4 rounded-xl',
              'bg-white dark:bg-neutral-900',
              'border border-neutral-200/60 dark:border-neutral-800/60',
              'text-left group transition-all',
              'hover:shadow-sm hover:border-primary-500/20'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Try Demo Mode
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Click to fill demo credentials
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-primary-500/10 transition-colors">
                <ArrowRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400 group-hover:text-primary-500" />
              </div>
            </div>
          </motion.button>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mb-6 p-4 rounded-xl',
                'bg-red-50 dark:bg-red-900/20',
                'border border-red-200/60 dark:border-red-800/60',
                'flex items-start gap-3'
              )}
            >
              <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none transition-colors',
                    focusedField === 'email'
                      ? 'text-primary-500'
                      : 'text-neutral-400 dark:text-neutral-500'
                  )}
                >
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@company.com"
                  required
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-xl',
                    'bg-white dark:bg-neutral-900',
                    'border transition-all duration-200',
                    'text-neutral-900 dark:text-white',
                    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                    focusedField === 'email'
                      ? 'border-primary-500 ring-2 ring-primary-500/20'
                      : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700'
                  )}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none transition-colors',
                    focusedField === 'password'
                      ? 'text-primary-500'
                      : 'text-neutral-400 dark:text-neutral-500'
                  )}
                >
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  required
                  className={cn(
                    'w-full pl-12 pr-12 py-3 rounded-xl',
                    'bg-white dark:bg-neutral-900',
                    'border transition-all duration-200',
                    'text-neutral-900 dark:text-white',
                    'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                    focusedField === 'password'
                      ? 'border-primary-500 ring-2 ring-primary-500/20'
                      : 'border-neutral-200/60 dark:border-neutral-800/60 hover:border-neutral-300 dark:hover:border-neutral-700'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                'relative w-full py-3 px-4 rounded-xl',
                'bg-neutral-900 dark:bg-white',
                'text-white dark:text-neutral-900',
                'font-semibold text-sm',
                'transition-all duration-200',
                'hover:bg-neutral-800 dark:hover:bg-neutral-100',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'overflow-hidden'
              )}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 dark:border-neutral-900/30 border-t-white dark:border-t-neutral-900 rounded-full"
                  />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-8">
            <a href="/" className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
              ← Back to website
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
