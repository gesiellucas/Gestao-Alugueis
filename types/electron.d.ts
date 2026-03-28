/**
 * Ambient global type declarations for the Electron IPC bridge.
 * Uses `declare global` so TypeScript treats this as a module augmentation,
 * which is reliably picked up regardless of compilation context.
 */

export {};

declare global {
  type ElectronChannel =
    | 'db:config:get'
    | 'db:config:set'
    | 'db:config:getAll'
    | 'db:customers:getAll'
    | 'db:customers:getPaginated'
    | 'db:customers:getById'
    | 'db:customers:create'
    | 'db:customers:update'
    | 'db:customers:delete'
    | 'db:customers:upsertBatch'
    | 'db:vehicles:getAll'
    | 'db:vehicles:getPaginated'
    | 'db:vehicles:getById'
    | 'db:vehicles:create'
    | 'db:vehicles:update'
    | 'db:vehicles:delete'
    | 'db:vehicles:upsertBatch'
    | 'db:vehicleModels:getAll'
    | 'db:vehicleModels:getPaginated'
    | 'db:vehicleModels:getById'
    | 'db:vehicleModels:create'
    | 'db:vehicleModels:update'
    | 'db:vehicleModels:delete'
    | 'db:vehicleModels:upsertBatch'
    | 'db:rentals:getAll'
    | 'db:rentals:getPaginated'
    | 'db:rentals:getById'
    | 'db:rentals:create'
    | 'db:rentals:update'
    | 'db:rentals:delete'
    | 'db:rentals:upsertBatch'
    | 'db:contracts:getAll'
    | 'db:contracts:getPaginated'
    | 'db:contracts:getById'
    | 'db:contracts:getByRental'
    | 'db:contracts:create'
    | 'db:contracts:update'
    | 'db:contracts:delete'
    | 'db:contracts:upsertBatch'
    | 'db:maintenance:getAll'
    | 'db:maintenance:getPaginated'
    | 'db:maintenance:getById'
    | 'db:maintenance:create'
    | 'db:maintenance:update'
    | 'db:maintenance:delete'
    | 'db:maintenance:upsertBatch'
    | 'db:workshops:getAll'
    | 'db:workshops:getPaginated'
    | 'db:workshops:getById'
    | 'db:workshops:create'
    | 'db:workshops:update'
    | 'db:workshops:delete'
    | 'db:workshops:upsertBatch'
    | 'db:documents:getAll'
    | 'db:documents:getPaginated'
    | 'db:documents:getByParent'
    | 'db:documents:create'
    | 'db:documents:delete'
    | 'db:documents:upsertBatch'
    | 'db:unavailableVehicles:getAll'
    | 'db:unavailableVehicles:getById'
    | 'db:unavailableVehicles:getByVehicle'
    | 'db:unavailableVehicles:create'
    | 'db:unavailableVehicles:delete'
    | 'db:unavailableVehicles:upsertBatch'
    | 'db:vehicleStatuses:getAll'
    | 'db:vehicleStatuses:getPaginated'
    | 'db:vehicleStatuses:getById'
    | 'db:vehicleStatuses:create'
    | 'db:vehicleStatuses:update'
    | 'db:vehicleStatuses:delete'
    | 'db:vehicleStatuses:upsertBatch'
    | 'sync:getMetadata'
    | 'sync:setMetadata'
    | 'sync:status'
    | 'sync:force'
    | 'sync:reinit'
    | 'app:isElectron'
    | 'app:getVersion'
    | 'db:roles:getAll'
    | 'db:roles:getPaginated'
    | 'db:roles:create'
    | 'db:roles:update'
    | 'db:roles:delete'
    | 'db:users:getAll'
    | 'db:users:getPaginated'
    | 'db:users:create'
    | 'db:users:update'
    | 'db:users:delete'
    | 'db:users:login';

  interface ElectronAPI {
    invoke<T = unknown>(channel: ElectronChannel, args?: unknown): Promise<T>;
    isElectron: true;
    windowControls: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
    };
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}
