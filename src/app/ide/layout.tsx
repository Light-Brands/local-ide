import type { Metadata, Viewport } from 'next';
import { IDEProviders } from './providers';

export const metadata: Metadata = {
  title: 'Local IDE',
  description: 'Mobile-first AI-powered IDE with Claude integration',
  manifest: '/manifest.json',
  applicationName: 'Local IDE',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Local IDE',
    startupImage: [
      {
        url: '/icons/icon-512x512.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192x192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Local IDE',
    'msapplication-TileColor': '#0a0a0a',
    'msapplication-tap-highlight': 'no',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#0a0a0a',
};

export default function IDELayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <IDEProviders>
      {/* PWA container - safe area handled by child components */}
      <div
        className="h-[100dvh] w-full overflow-hidden bg-neutral-950"
        style={{
          // Only apply horizontal safe areas here
          // Top/bottom handled by header/nav components
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        {children}
      </div>
    </IDEProviders>
  );
}
