'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type Orientation = 'portrait' | 'landscape';

// Comprehensive device presets organized by category
export const DEVICE_PRESETS = {
  // Responsive / No frame
  none: { width: '100%', height: '100%', name: 'Responsive', category: 'responsive' },

  // Phones
  'iphone-se': { width: 375, height: 667, name: 'iPhone SE', category: 'phone' },
  'iphone-12': { width: 390, height: 844, name: 'iPhone 12/13/14', category: 'phone' },
  'iphone-12-mini': { width: 360, height: 780, name: 'iPhone 12 Mini', category: 'phone' },
  'iphone-14-pro': { width: 393, height: 852, name: 'iPhone 14 Pro', category: 'phone' },
  'iphone-14-pro-max': { width: 430, height: 932, name: 'iPhone 14 Pro Max', category: 'phone' },
  'pixel-7': { width: 412, height: 915, name: 'Pixel 7', category: 'phone' },
  'galaxy-s21': { width: 360, height: 800, name: 'Galaxy S21', category: 'phone' },
  'galaxy-fold': { width: 280, height: 653, name: 'Galaxy Fold', category: 'phone' },

  // Tablets
  'ipad-mini': { width: 768, height: 1024, name: 'iPad Mini', category: 'tablet' },
  'ipad-air': { width: 820, height: 1180, name: 'iPad Air', category: 'tablet' },
  'ipad-pro-11': { width: 834, height: 1194, name: 'iPad Pro 11"', category: 'tablet' },
  'ipad-pro-12': { width: 1024, height: 1366, name: 'iPad Pro 12.9"', category: 'tablet' },
  'surface-pro': { width: 912, height: 1368, name: 'Surface Pro', category: 'tablet' },
  'galaxy-tab': { width: 800, height: 1280, name: 'Galaxy Tab S7', category: 'tablet' },

  // Desktop / Laptop
  'macbook-air': { width: 1280, height: 800, name: 'MacBook Air 13"', category: 'desktop' },
  'macbook-pro-14': { width: 1512, height: 982, name: 'MacBook Pro 14"', category: 'desktop' },
  'macbook-pro-16': { width: 1728, height: 1117, name: 'MacBook Pro 16"', category: 'desktop' },
  'desktop-hd': { width: 1366, height: 768, name: 'Desktop HD', category: 'desktop' },
  'desktop-fhd': { width: 1920, height: 1080, name: 'Desktop FHD', category: 'desktop' },
  'desktop-2k': { width: 2560, height: 1440, name: 'Desktop 2K', category: 'desktop' },
} as const;

// Type derived from the presets object
export type DeviceType = keyof typeof DEVICE_PRESETS;

// Legacy mapping for backwards compatibility
export const DEVICE_SIZES = DEVICE_PRESETS;

// Group devices by category for the dropdown
export const DEVICE_CATEGORIES = {
  responsive: { label: 'Responsive', devices: ['none'] },
  phone: { label: 'Phones', devices: ['iphone-se', 'iphone-12', 'iphone-12-mini', 'iphone-14-pro', 'iphone-14-pro-max', 'pixel-7', 'galaxy-s21', 'galaxy-fold'] },
  tablet: { label: 'Tablets', devices: ['ipad-mini', 'ipad-air', 'ipad-pro-11', 'ipad-pro-12', 'surface-pro', 'galaxy-tab'] },
  desktop: { label: 'Desktop', devices: ['macbook-air', 'macbook-pro-14', 'macbook-pro-16', 'desktop-hd', 'desktop-fhd', 'desktop-2k'] },
} as const;

interface DeviceFrameProps {
  device: DeviceType;
  orientation: Orientation;
  children: React.ReactNode;
  className?: string;
}

export const DeviceFrame = memo(function DeviceFrame({
  device,
  orientation,
  children,
  className,
}: DeviceFrameProps) {
  const getDimensions = () => {
    const size = DEVICE_PRESETS[device];
    if (!size || typeof size.width === 'string') {
      return { width: '100%', height: '100%' };
    }

    if (orientation === 'landscape') {
      return { width: `${size.height}px`, height: `${size.width}px` };
    }
    return { width: `${size.width}px`, height: `${size.height}px` };
  };

  const dimensions = getDimensions();
  const preset = DEVICE_PRESETS[device];
  const isPhone = preset?.category === 'phone';
  const showNotch = isPhone && orientation === 'portrait';
  const hasFrame = device !== 'none';

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300',
        hasFrame && 'ring-8 ring-neutral-800 dark:ring-neutral-700',
        className
      )}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      {/* Device notch for phone */}
      {showNotch && (
        <div className="h-6 bg-neutral-800 dark:bg-neutral-700 flex items-center justify-center">
          <div className="w-20 h-4 bg-neutral-900 dark:bg-neutral-800 rounded-full" />
        </div>
      )}
      {children}
    </div>
  );
});

interface DeviceInfoProps {
  device: DeviceType;
  orientation: Orientation;
}

export const DeviceInfo = memo(function DeviceInfo({
  device,
  orientation,
}: DeviceInfoProps) {
  if (device === 'none') return null;

  const size = DEVICE_PRESETS[device];
  if (!size || typeof size.width === 'string') return null;

  return (
    <>
      <span>{size.name}</span>
      <span>
        {orientation === 'portrait'
          ? `${size.width}x${size.height}`
          : `${size.height}x${size.width}`}
      </span>
    </>
  );
});
