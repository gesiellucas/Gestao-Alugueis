/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  appId: 'br.com.gclocamoto.app',
  productName: 'GC Locamoto',
  copyright: 'Copyright © 2026 GC Locamoto',

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
    icon: 'resources/icon.ico',
    target: [{ target: 'nsis', arch: ['x64'] }],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  // ── macOS ──
  mac: {
    category: 'public.app-category.business',
    target: [
      {
        target: 'dmg',
        arch: ['universal']
      }
    ],
    icon: 'resources/icon.icns',
    hardenedRuntime: true,
    gatekeeperAssess: false,
  },
  dmg: {
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 130,
        y: 150,
        type: 'file'
      }
    ]
  },
};

module.exports = config;
