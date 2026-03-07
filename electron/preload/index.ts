import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of all valid IPC channels for security
const VALID_CHANNELS = [
  // Config
  'db:config:get',
  'db:config:set',
  'db:config:getAll',
  // Customers
  'db:customers:getAll',
  'db:customers:getById',
  'db:customers:create',
  'db:customers:update',
  'db:customers:delete',
  'db:customers:upsertBatch',
  // Vehicles
  'db:vehicles:getAll',
  'db:vehicles:getById',
  'db:vehicles:create',
  'db:vehicles:update',
  'db:vehicles:delete',
  'db:vehicles:upsertBatch',
  // Rentals
  'db:rentals:getAll',
  'db:rentals:getById',
  'db:rentals:create',
  'db:rentals:update',
  'db:rentals:delete',
  'db:rentals:upsertBatch',
  // Maintenance
  'db:maintenance:getAll',
  'db:maintenance:getById',
  'db:maintenance:create',
  'db:maintenance:update',
  'db:maintenance:delete',
  'db:maintenance:upsertBatch',
  // Sync
  'sync:getMetadata',
  'sync:setMetadata',
  'sync:status',
  'sync:force',
  // App
  'app:isElectron',
  'app:getVersion',
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
});
