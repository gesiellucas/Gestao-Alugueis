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

  // ── macOS ──
  mac: {
    category: 'public.app-category.business',
    target: [
      {
        target: 'dmg',
        arch: ['universal']
      }
    ],
    // electron-builder will try to use the .ico and convert it, 
    // or you can provide a resources/icon.icns later.
    icon: 'resources/icon.ico',
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
