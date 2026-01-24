'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  Bell,
  Lock,
  Palette,
  Globe,
  Mail,
  Shield,
  Save,
  Camera,
  Code2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/lib/admin/auth';
import { colors, gradients } from '@/lib/design/tokens';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'site', label: 'Site Settings', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Code2, href: '/admin/settings/development' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, isDemo } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    website: '',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    contentAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: 'system',
    accentColor: 'blue',
    reducedMotion: false,
  });

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="admin-section"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Manage your account and site preferences
        </p>
      </motion.div>

      {/* Settings Layout */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className={cn(
            'p-2 space-y-1 rounded-xl border',
            'bg-white dark:bg-neutral-900',
            'border-neutral-200/60 dark:border-neutral-800/60'
          )} aria-label="Settings navigation">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              // If tab has href, use Link for navigation
              if ('href' in tab && tab.href) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </Link>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon className={cn(
                    'w-[18px] h-[18px] transition-transform',
                    activeTab === tab.id && 'scale-110'
                  )} strokeWidth={activeTab === tab.id ? 2.5 : 2} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'rounded-xl border overflow-hidden',
              'bg-white dark:bg-neutral-900',
              'border-neutral-200/60 dark:border-neutral-800/60'
            )}
            role="tabpanel"
            aria-label={`${tabs.find(t => t.id === activeTab)?.label} settings`}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Profile Settings
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Update your personal information
                  </p>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className={cn('w-20 h-20 rounded-full flex items-center justify-center text-white', colors.primary.solid)}>
                      <span className="text-2xl font-bold">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow hover:shadow-md transition-shadow">
                      <Camera className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      Profile Photo
                    </p>
                    <p className="text-sm text-neutral-500">
                      JPG or PNG. Max 2MB.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="profile-name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Full Name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm',
                        'bg-white dark:bg-neutral-900',
                        'border border-neutral-200 dark:border-neutral-800',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="profile-email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Email
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm',
                        'bg-white dark:bg-neutral-900',
                        'border border-neutral-200 dark:border-neutral-800',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="profile-bio" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm resize-none',
                      'bg-white dark:bg-neutral-900',
                      'border border-neutral-200 dark:border-neutral-800',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    )}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="profile-website" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Website
                  </label>
                  <input
                    id="profile-website"
                    type="url"
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                    placeholder="https://example.com"
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm',
                      'bg-white dark:bg-neutral-900',
                      'border border-neutral-200 dark:border-neutral-800',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    )}
                  />
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Notification Preferences
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Choose what updates you want to receive
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      key: 'emailUpdates',
                      label: 'Email Updates',
                      description: 'Receive email notifications for important updates',
                      icon: Mail,
                    },
                    {
                      key: 'contentAlerts',
                      label: 'Content Alerts',
                      description: 'Get notified when content is published or updated',
                      icon: Bell,
                    },
                    {
                      key: 'securityAlerts',
                      label: 'Security Alerts',
                      description: 'Important security notifications',
                      icon: Shield,
                    },
                    {
                      key: 'marketingEmails',
                      label: 'Marketing Emails',
                      description: 'Receive tips and product updates',
                      icon: Mail,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const key = item.key as keyof typeof notifications;
                    return (
                      <div
                        key={item.key}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-lg border',
                          'bg-white dark:bg-neutral-900',
                          'border-neutral-200/60 dark:border-neutral-800/60'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {item.label}
                            </p>
                            <p className="text-sm text-neutral-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[key]}
                            onChange={(e) =>
                              setNotifications({
                                ...notifications,
                                [key]: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary" />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Security Settings
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Manage your account security
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Change Password */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60'
                  )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Password
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Last changed 30 days ago
                          </p>
                        </div>
                      </div>
                      <button className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', colors.primary.text, colors.primary.bg.replace('bg-', 'hover:bg-'))}>
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Auth */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Add an extra layer of security
                          </p>
                        </div>
                      </div>
                      <button className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', colors.primary.solid, 'text-white hover:opacity-90')}>
                        Enable
                      </button>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Active Sessions
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Manage your active sessions
                          </p>
                        </div>
                      </div>
                      <button className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', colors.error.text, colors.error.bg.replace('bg-', 'hover:bg-'))}>
                        Sign out all
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Appearance
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Customize how the admin panel looks
                  </p>
                </div>

                {/* Theme Selection */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'light', label: 'Light' },
                      { id: 'dark', label: 'Dark' },
                      { id: 'system', label: 'System' },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() =>
                          setAppearance({ ...appearance, theme: theme.id })
                        }
                        className={cn(
                          'p-4 rounded-lg border-2 text-center transition-all',
                          appearance.theme === theme.id
                            ? 'border-primary bg-primary/10 dark:bg-primary/20'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900'
                        )}
                      >
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {theme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Accent Color
                  </label>
                  <div className="flex gap-3">
                    {[
                      { id: 'primary', color: colors.primary.solid },
                      { id: 'secondary', color: colors.secondary.solid },
                      { id: 'neutral', color: 'bg-neutral-500 dark:bg-neutral-400' },
                    ].map((accent) => (
                      <button
                        key={accent.id}
                        onClick={() =>
                          setAppearance({ ...appearance, accentColor: accent.id })
                        }
                        className={cn(
                          'w-10 h-10 rounded-full transition-all',
                          accent.color,
                          appearance.accentColor === accent.id
                            ? 'ring-2 ring-offset-2 ring-primary dark:ring-primary'
                            : ''
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Reduced Motion */}
                <div className={cn(
                  'flex items-center justify-between p-4 rounded-lg border',
                  'bg-white dark:bg-neutral-900',
                  'border-neutral-200/60 dark:border-neutral-800/60'
                )}>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      Reduced Motion
                    </p>
                    <p className="text-sm text-neutral-500">
                      Reduce animations throughout the interface
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appearance.reducedMotion}
                      onChange={(e) =>
                        setAppearance({
                          ...appearance,
                          reducedMotion: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary" />
                  </label>
                </div>
              </div>
            )}

            {/* Site Settings Tab */}
            {activeTab === 'site' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Site Settings
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Configure your website settings
                  </p>
                </div>

                {isDemo && (
                  <div className={cn('p-4 rounded-lg border', colors.primary.bg, colors.primary.border)}>
                    <p className={cn('text-sm', colors.primary.text)}>
                      Site settings are read-only in demo mode. Connect Supabase to enable editing.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Site Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Light Brands"
                      disabled={isDemo}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl text-sm',
                        'bg-white dark:bg-neutral-900',
                        'border border-neutral-200 dark:border-neutral-800',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                        isDemo && 'opacity-50 cursor-not-allowed'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Site Description
                    </label>
                    <textarea
                      defaultValue="A premium Next.js boilerplate with AI-first workflows"
                      disabled={isDemo}
                      rows={3}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg resize-none',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                        isDemo && 'opacity-50 cursor-not-allowed'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Site URL
                    </label>
                    <input
                      type="url"
                      defaultValue="https://lightbrands.dev"
                      disabled={isDemo}
                      className={cn(
                        'w-full px-4 py-2.5 rounded-xl text-sm',
                        'bg-white dark:bg-neutral-900',
                        'border border-neutral-200 dark:border-neutral-800',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                        isDemo && 'opacity-50 cursor-not-allowed'
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Integrations
                  </h2>
                  <p className="text-sm text-neutral-500 mt-1">
                    Connect external services
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Supabase */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.success.solid)}>
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Supabase
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {isDemo ? 'Not connected' : 'Connected'}
                          </p>
                        </div>
                      </div>
                      <button className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                        isDemo
                          ? cn(colors.success.solid, 'text-white hover:opacity-90')
                          : 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      )}>
                        {isDemo ? 'Connect' : 'Configure'}
                      </button>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.primary.solid)}>
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Google Analytics
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Not connected
                          </p>
                        </div>
                      </div>
                      <button className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', colors.primary.solid, 'text-white hover:opacity-90')}>
                        Connect
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className={cn(
                    'p-4 rounded-lg border',
                    'bg-white dark:bg-neutral-900',
                    'border-neutral-200/60 dark:border-neutral-800/60'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.secondary.solid)}>
                          <Mail className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Email Provider
                          </p>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Not connected
                          </p>
                        </div>
                      </div>
                      <button className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors', colors.secondary.solid, 'text-white hover:opacity-90')}>
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <footer className="p-6 border-t border-neutral-200/60 dark:border-neutral-800/60 flex justify-end">
              <motion.button
                onClick={handleSave}
                disabled={isSaving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary-hover',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                aria-busy={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" aria-hidden="true" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </footer>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
