/**
 * Local SQLite vehicle statuses API
 */
import { ipcInvoke } from '../../lib/ipc';
import { VehicleStatusRecord } from '../../types';

export const localVehicleStatusesApi = {
    async getAll(): Promise<VehicleStatusRecord[]> {
        return ipcInvoke<VehicleStatusRecord[]>('db:vehicleStatuses:getAll');
    },

    async getById(id: number): Promise<VehicleStatusRecord | null> {
        return ipcInvoke<VehicleStatusRecord | null>('db:vehicleStatuses:getById', { id });
    },

    async create(status: { name: string; color?: string; is_default?: boolean }): Promise<VehicleStatusRecord> {
        return ipcInvoke<VehicleStatusRecord>('db:vehicleStatuses:create', status);
    },

    async update(id: number, updates: { name?: string; color?: string; is_default?: boolean }): Promise<VehicleStatusRecord> {
        return ipcInvoke<VehicleStatusRecord>('db:vehicleStatuses:update', { id, ...updates });
    },

    async delete(id: number): Promise<void> {
        await ipcInvoke('db:vehicleStatuses:delete', { id });
    },
};
