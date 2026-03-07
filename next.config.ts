import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static HTML export — only in production (Electron build).
  // In dev mode this constraint causes "missing param" errors for dynamic routes.
  output: isProd ? 'export' : undefined,

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
