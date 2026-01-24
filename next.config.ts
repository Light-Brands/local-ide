import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use separate build directories for App and IDE
  // Set via NEXT_DIST_DIR env var (e.g., .next-app or .next-ide)
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // Allow cross-origin requests from tunnel domain in development
  allowedDevOrigins: ['https://ide.lightbrands.ai', 'https://*.lightbrands.ai'],

  // Proxy /app-preview/* to the App server (port 3000)
  // This allows the IDE (port 4000) to serve app content through the tunnel
  async rewrites() {
    return [
      {
        source: '/app-preview/:path*',
        destination: 'http://localhost:3000/:path*',
      },
    ];
  },

  // Allow the app to be embedded in iframes and handle CORS for IDE-App communication
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
            value: "frame-ancestors 'self' http://localhost:* https://localhost:* https://ide.lightbrands.ai https://*.lightbrands.ai",
          },
          // Allow CORS for IDE (port 4000) to call App (port 3000) APIs
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://localhost:4000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },

  // Enable Turbopack (default in Next.js 16)
  // Empty config acknowledges Turbopack usage while webpack config exists for fallback
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
