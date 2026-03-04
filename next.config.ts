import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static HTML export — required for Electron to load the app via file://
  output: 'export',

  // Trailing slash ensures each route generates its own index.html
  // e.g. /clientes -> /clientes/index.html (not /clientes.html)
  trailingSlash: true,

  // In production (Electron), assets must be referenced with relative paths
  // so that file:// URLs resolve correctly from the out/ directory.
  assetPrefix: isProd ? './' : '',

  images: {
    // Image optimization is not available in static export
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  poweredByHeader: false,
};

export default nextConfig;
