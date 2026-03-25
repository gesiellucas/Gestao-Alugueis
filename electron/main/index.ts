import { app, BrowserWindow, shell, protocol, ipcMain, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';

// Configure dotenv to read from app bundle (asar root)
dotenv.config({ path: path.join(app.getAppPath(), '.env') });
dotenv.config({ path: path.join(app.getAppPath(), '.env.local'), override: true });

import { initDatabase, registerIpcHandlers } from '../../database/ipc/handlers';
import { getRawDb } from '../../database/client/sqlite';
import { initSyncEngine } from '../../database/ipc/sync';

// Register custom protocol schemes as privileged.
// This must be done before the app is ready and before any windows are created.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      allowServiceWorkers: true,
      corsEnabled: true,
    },
  },
]);

// Define app identity para ícone correto na barra de tarefas do Windows
app.setAppUserModelId('br.com.gclocamoto.app');

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

// Register custom protocol BEFORE app is ready
// This allows the SPA to handle all routes with a single index.html
app.whenReady().then(async () => {
  const outDir = path.join(app.getAppPath(), 'out');

  if (!isDev) {
    // Protocol handle (modern API)
    protocol.handle('app', async (request) => {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);

      // Handle the 'app://app/' prefix
      if (pathname.startsWith('/')) {
        pathname = pathname.substring(1);
      }

      // 1. Determine local path within the 'out' folder
      let targetPath = path.join(app.getAppPath(), 'out', pathname);

      // 2. SPA Fallback & Extensionless Routing
      if (!path.extname(targetPath)) {
        const potentialHtml = path.join(targetPath, 'index.html');
        if (fs.existsSync(potentialHtml)) {
          targetPath = potentialHtml;
        } else if (fs.existsSync(targetPath + '.html')) {
          targetPath = targetPath + '.html';
        } else if (!fs.existsSync(targetPath)) {
          // Detect Next.js Dynamic Routes with [id] generated as "placeholder"
          const pathParts = pathname.split('/').filter(Boolean);
          if (
            pathParts.length >= 2 &&
            ['alugueis', 'cliente', 'veiculo', 'aluguel', 'oficina'].includes(pathParts[0]) &&
            !['novo', 'editar', 'novo_veiculo', 'novo_entrada'].includes(pathParts[1])
          ) {
            const dynamicHtml = path.join(app.getAppPath(), 'out', pathParts[0], 'placeholder', 'index.html');
            if (fs.existsSync(dynamicHtml)) {
              targetPath = dynamicHtml;
            } else {
              targetPath = path.join(app.getAppPath(), 'out', 'index.html');
            }
          } else {
            // Fallback to root index.html for unknown routes (SPA behavior)
            targetPath = path.join(app.getAppPath(), 'out', 'index.html');
          }
        }
      }
      // 3. Nested Assets Fix (_next folder)
      else if (!fs.existsSync(targetPath) && pathname.includes('_next/')) {
        const assetPath = pathname.substring(pathname.indexOf('_next/'));
        targetPath = path.join(app.getAppPath(), 'out', assetPath);
      }

      try {
        const fileUrl = pathToFileURL(targetPath).href;
        return await net.fetch(fileUrl);
      } catch (err) {
        console.error(`[Protocol] Failed to fetch: ${request.url} -> ${targetPath}`, err);
        return new Response('Not Found', { status: 404 });
      }
    });
  }

  // 1. Initialize database
  try {
    await initDatabase();
  } catch (err) {
    console.error('[Main] Failed to initialize database. App will not start.', err);
    return; // Stop execution
  }

  // 2. Inject Supabase credentials into local SQLite config (from .env)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const db = getRawDb();
      // Using execute for batching or direct execution with libsql client
      await db.execute({
        sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
        args: ['NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL]
      });
      await db.execute({
        sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
        args: ['NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY]
      });
    } catch (err) {
      console.error('[Main] Failed to inject Supabase credentials:', err);
    }
  }

  registerIpcHandlers();
  initSyncEngine();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function createWindow(): void {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.resolve('public/icon-app.png');

  const preloadPath = path.join(__dirname, '..', 'preload', 'index.js');
  console.log('[Main] Preload path:', preloadPath);
  console.log('[Main] Preload exists?', fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'GC Locamoto',
    icon: iconPath,
    frame: false,
    backgroundColor: '#004AAD',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,  // Required for security
      nodeIntegration: false,  // Required for security
      sandbox: false,          // Allow preload to use Node APIs
    },
  });

  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('app://app/index.html');
  }

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Focus existing window on second instance
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
