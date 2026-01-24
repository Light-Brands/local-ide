'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIDEStore } from '../../stores/ideStore';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Github,
  Triangle,
  Database,
  Sparkles,
  Check,
  ExternalLink,
  ChevronRight,
  Smartphone,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from 'lucide-react';

export function SettingsPane() {
  const settings = useIDEStore((state) => state.settings);
  const updateSettings = useIDEStore((state) => state.updateSettings);
  const integrations = useIDEStore((state) => state.integrations);

  const themeOptions = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Settings</h2>
            <p className="text-sm text-neutral-500">Customize your IDE experience</p>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-4 space-y-6">
        {/* Appearance Section */}
        <section>
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Appearance
          </h3>
          <div className="space-y-3">
            {/* Theme */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
              <label className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 block">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateSettings({ theme: option.value })}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg transition-colors',
                      settings.theme === option.value
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    )}
                  >
                    <option.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Font Size */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-600 dark:text-neutral-400">
                  Editor Font Size
                </label>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {settings.editorFontSize}px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="24"
                value={settings.editorFontSize}
                onChange={(e) => updateSettings({ editorFontSize: parseInt(e.target.value) })}
                className="w-full mt-3"
              />
            </div>

            {/* Terminal Font Size */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-neutral-600 dark:text-neutral-400">
                  Terminal Font Size
                </label>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {settings.terminalFontSize}px
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="20"
                value={settings.terminalFontSize}
                onChange={(e) => updateSettings({ terminalFontSize: parseInt(e.target.value) })}
                className="w-full mt-3"
              />
            </div>
          </div>
        </section>

        {/* Behavior Section */}
        <section>
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Behavior
          </h3>
          <div className="space-y-2">
            {/* Auto Save */}
            <button
              onClick={() => updateSettings({ autoSave: !settings.autoSave })}
              className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                {settings.autoSave ? (
                  <Eye className="w-5 h-5 text-primary-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-neutral-400" />
                )}
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Auto Save</span>
              </div>
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  settings.autoSave ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    settings.autoSave ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </div>
            </button>

            {/* Haptic Feedback */}
            <button
              onClick={() => updateSettings({ hapticFeedback: !settings.hapticFeedback })}
              className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                {settings.hapticFeedback ? (
                  <Volume2 className="w-5 h-5 text-primary-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-neutral-400" />
                )}
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Haptic Feedback
                </span>
              </div>
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  settings.hapticFeedback ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    settings.hapticFeedback ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </div>
            </button>

            {/* Reduced Motion */}
            <button
              onClick={() => updateSettings({ reducedMotion: !settings.reducedMotion })}
              className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-neutral-400" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Reduced Motion
                </span>
              </div>
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  settings.reducedMotion ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                    settings.reducedMotion ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </div>
            </button>
          </div>
        </section>

        {/* Integrations Section */}
        <section>
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Integrations
          </h3>
          <div className="space-y-2">
            {/* GitHub */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 block">
                    GitHub
                  </span>
                  {integrations.github.connected && integrations.github.repo && (
                    <span className="text-xs text-neutral-500">
                      {integrations.github.owner}/{integrations.github.repo}
                    </span>
                  )}
                </div>
              </div>
              {integrations.github.connected ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              )}
            </div>

            {/* Vercel */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Triangle className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 block">
                    Vercel
                  </span>
                  {integrations.vercel.connected && integrations.vercel.projectName && (
                    <span className="text-xs text-neutral-500">
                      {integrations.vercel.projectName}
                    </span>
                  )}
                </div>
              </div>
              {integrations.vercel.connected ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              )}
            </div>

            {/* Supabase */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">Supabase</span>
              </div>
              {integrations.supabase.connected ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              )}
            </div>

            {/* Claude */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <div>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 block">
                    Claude AI
                  </span>
                  {integrations.claude.connected && (
                    <span className="text-xs text-neutral-500">{integrations.claude.model}</span>
                  )}
                </div>
              </div>
              {integrations.claude.connected ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-400" />
              )}
            </div>
          </div>
        </section>

        {/* Manage Integrations Link */}
        <div className="pt-2">
          <a
            href="/ide/onboarding"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors text-sm font-medium"
          >
            Manage Integrations
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
