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
  // Vehicle Models
  'db:vehicleModels:getAll',
  'db:vehicleModels:getById',
  'db:vehicleModels:create',
  'db:vehicleModels:update',
  'db:vehicleModels:delete',
  'db:vehicleModels:upsertBatch',
  // Rentals
  'db:rentals:getAll',
  'db:rentals:getById',
  'db:rentals:create',
  'db:rentals:update',
  'db:rentals:delete',
  'db:rentals:upsertBatch',
  // Contracts
  'db:contracts:getAll',
  'db:contracts:getById',
  'db:contracts:getByRental',
  'db:contracts:create',
  'db:contracts:update',
  'db:contracts:delete',
  'db:contracts:upsertBatch',
  // Maintenance
  'db:maintenance:getAll',
  'db:maintenance:getById',
  'db:maintenance:create',
  'db:maintenance:update',
  'db:maintenance:delete',
  'db:maintenance:upsertBatch',
  // Workshops
  'db:workshops:getAll',
  'db:workshops:getById',
  'db:workshops:create',
  'db:workshops:update',
  'db:workshops:delete',
  'db:workshops:upsertBatch',
  // Documents
  'db:documents:getAll',
  'db:documents:getByParent',
  'db:documents:create',
  'db:documents:delete',
  'db:documents:upsertBatch',
  // Sync
  'sync:getMetadata',
  'sync:setMetadata',
  'sync:status',
  'sync:force',
  // App
  'app:isElectron',
  'app:getVersion',
  // Roles
  'db:roles:getAll',
  'db:roles:create',
  'db:roles:update',
  'db:roles:delete',
  // Users
  'db:users:getAll',
  'db:users:create',
  'db:users:update',
  'db:users:delete',
  'db:users:login',
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
