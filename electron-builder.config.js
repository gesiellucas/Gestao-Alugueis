/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'br.com.gclocamoto.app',
  productName: 'GC Locamoto',
  copyright: 'Copyright © 2026 GC Locamoto',

  icon: 'resources/icon.ico',

  directories: {
    output: 'release',
    buildResources: 'resources',
  },

  // Files included in the built app
  files: [
    'dist/electron/**/*',                      // Compiled Electron main + preload (CommonJS)
    'out/**/*',                               // Next.js static export
    'node_modules/**/*',
    'package.json',
    '.env*'
  ],

  // Rebuild native modules for Electron ABI during packaging
  npmRebuild: true,


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

module.exports = config;
