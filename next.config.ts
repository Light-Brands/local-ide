import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the app to be embedded in iframes (for the preview pane)
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' http://localhost:* https://localhost:*",
          },
        ],
      },
    ];
  },

  // Turbopack config (Next.js 16+ default bundler)
  turbopack: {},

  // Handle native module imports that might leak into the build (for webpack fallback)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3', 'node-pty'];
    }
    return config;
  },
};

export default nextConfig;
