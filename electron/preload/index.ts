import { contextBridge, ipcRenderer } from 'electron';

console.log('[PRELOAD] Preload script starting...');

// Whitelist of all valid IPC channels for security
const VALID_CHANNELS = [
  // App
  'app:isElectron',
  'app:getVersion',
  // Window controls (handled via direct invoke in bridge, but keep for consistency)
  'window:minimize',
  'window:maximize',
  'window:close',
  'window:isMaximized',
] as const;


type ValidChannel = typeof VALID_CHANNELS[number];

contextBridge.exposeInMainWorld('electronAPI', {
  /** Invoke an IPC handler in the main process. Channel must be whitelisted. */
  invoke: <T = unknown>(channel: ValidChannel, args?: unknown): Promise<T> => {
    if (!(VALID_CHANNELS as readonly string[]).includes(channel)) {
      return Promise.reject(new Error(`Canal IPC inválido: ${channel}`));
    }
    return ipcRenderer.invoke(channel, args) as Promise<T>;
  },

  /** True when running inside Electron (allows renderer to detect environment) */
  isElectron: true as const,

  /** Frameless window controls */
  windowControls: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  },
});
