import type { Configuration } from 'electron-builder';

const config: Configuration = {
  appId: 'br.com.gclocamoto.app',
  productName: 'GC Loca Moto',
  copyright: 'Copyright © 2025 GC Loca Moto',

  directories: {
    output: 'release',
    buildResources: 'resources',
  },

  // Files included in the built app
  files: [
    'dist/electron/**/*',   // Compiled Electron main + preload (CommonJS)
    'out/**/*',              // Next.js static export
    'node_modules/**/*',
    'package.json',
  ],

  // Rebuild native modules for Electron ABI during packaging
  npmRebuild: true,

  // CRITICAL: better-sqlite3 contains native .node files that cannot be
  // executed from inside the asar archive — they must be unpacked alongside it.
  asarUnpack: [
    'node_modules/better-sqlite3/**/*',
    'node_modules/bindings/**/*',
  ],

  // ── Windows ──
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },
};

export default config;
