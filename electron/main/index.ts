import { app, BrowserWindow, shell, protocol, ipcMain } from 'electron';
import path from 'path';
import 'dotenv/config';
import { initDatabase, registerIpcHandlers } from '../../database/ipc/handlers';
import { getRawDb } from '../../database/client/sqlite';
import { initSyncEngine } from '../../database/ipc/sync';

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
app.whenReady().then(() => {
  const outDir = path.join(app.getAppPath(), 'out');

  if (!isDev) {
    protocol.registerFileProtocol('app', (request, callback) => {
      const pathname = new URL(request.url).pathname;
      const hasExt = path.extname(pathname).length > 0;
      const target = hasExt
        ? path.join(outDir, pathname)
        : path.join(outDir, 'index.html');
      callback({ path: target });
    });
  }

  initDatabase();

  // Inject Supabase credentials into local SQLite config (from .env, se disponível)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const rawDb = getRawDb();
    rawDb.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    rawDb.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  registerIpcHandlers();
  initSyncEngine();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'GC Locamoto',
    frame: false,
    backgroundColor: '#004AAD',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
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
    mainWindow.loadURL('app://./index.html');
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
