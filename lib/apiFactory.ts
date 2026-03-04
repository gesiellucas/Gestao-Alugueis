/**
 * API factory: returns the correct API implementation based on the runtime environment.
 *
 * - Electron: uses the local SQLite API (via IPC)
 * - Browser / Next.js dev: uses the Supabase API directly
 *
 * This allows ALL existing component code to remain unchanged — only
 * AppContext.tsx needs to swap from importing services/api/* to using
 * these factory functions.
 */
import { isElectron } from './ipc';

// Supabase implementations (existing)
import { customersApi } from '../services/api/customers';
import { vehiclesApi } from '../services/api/vehicles';
import { rentalContractsApi } from '../services/api/rentalContracts';
import { maintenanceRecordsApi } from '../services/api/maintenanceRecords';

// Local SQLite implementations (new)
import { localCustomersApi } from '../services/localApi/customers';
import { localVehiclesApi } from '../services/localApi/vehicles';
import { localRentalsApi } from '../services/localApi/rentals';
import { localMaintenanceApi } from '../services/localApi/maintenance';

export function getCustomersApi() {
  return isElectron() ? localCustomersApi : customersApi;
}

export function getVehiclesApi() {
  return isElectron() ? localVehiclesApi : vehiclesApi;
}

export function getRentalsApi() {
  return isElectron() ? localRentalsApi : rentalContractsApi;
}

export function getMaintenanceApi() {
  return isElectron() ? localMaintenanceApi : maintenanceRecordsApi;
}
