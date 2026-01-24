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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Settings
        </h1>
        <p className="text-neutral-500 mt-1">
          Manage your account and site preferences
        </p>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-2 space-y-1">
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
                    'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  <Icon className={cn(
                    'w-[18px] h-[18px] transition-transform',
                    activeTab === tab.id && 'scale-110'
                  )} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                  <span className="text-sm font-medium">{tab.label}</span>
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
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
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
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <button className="absolute bottom-0 right-0 p-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full shadow">
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
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className={cn(
                        'w-full px-4 py-2.5 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) =>
                      setProfile({ ...profile, bio: e.target.value })
                    }
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg resize-none',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                    placeholder="https://example.com"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-lg',
                      'bg-neutral-50 dark:bg-neutral-800',
                      'border border-neutral-200 dark:border-neutral-700',
                      'text-neutral-900 dark:text-white',
                      'placeholder:text-neutral-400',
                      'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
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
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center">
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
                          <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-500" />
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
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Password
                          </p>
                          <p className="text-sm text-neutral-500">
                            Last changed 30 days ago
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Auth */}
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Two-Factor Authentication
                          </p>
                          <p className="text-sm text-neutral-500">
                            Add an extra layer of security
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">
                        Enable
                      </button>
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-800 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            Active Sessions
                          </p>
                          <p className="text-sm text-neutral-500">
                            Manage your active sessions
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
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
                      { id: 'blue', color: 'bg-blue-500' },
                      { id: 'purple', color: 'bg-purple-500' },
                      { id: 'green', color: 'bg-green-500' },
                      { id: 'orange', color: 'bg-orange-500' },
                      { id: 'pink', color: 'bg-pink-500' },
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
                            ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-white'
                            : ''
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Reduced Motion */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
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
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-500" />
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
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
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
                        'w-full px-4 py-2.5 rounded-lg',
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
                        'w-full px-4 py-2.5 rounded-lg',
                        'bg-neutral-50 dark:bg-neutral-800',
                        'border border-neutral-200 dark:border-neutral-700',
                        'text-neutral-900 dark:text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                        isDemo && 'opacity-50 cursor-not-allowed'
                      )}
                    />
                  </div>
                </div>
              </div>
            )}


            {/* Save Button */}
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
