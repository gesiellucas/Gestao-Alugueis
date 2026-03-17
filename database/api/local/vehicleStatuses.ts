/**
 * Local SQLite vehicle statuses API
 */
import { ipcInvoke } from '../../../lib/ipc';
import { VehicleStatusRecord, PaginatedResult } from '../../../types';

export const localVehicleStatusesApi = {
    async getAll(): Promise<VehicleStatusRecord[]> {
        return ipcInvoke<VehicleStatusRecord[]>('db:vehicleStatuses:getAll');
    },

    async getById(id: string): Promise<VehicleStatusRecord | null> {
        return ipcInvoke<VehicleStatusRecord | null>('db:vehicleStatuses:getById', { id });
    },

    async create(status: { name: string; color?: string; is_default?: boolean }): Promise<VehicleStatusRecord> {
        return ipcInvoke<VehicleStatusRecord>('db:vehicleStatuses:create', status);
    },

    async update(id: string, updates: { name?: string; color?: string; is_default?: boolean }): Promise<VehicleStatusRecord> {
        return ipcInvoke<VehicleStatusRecord>('db:vehicleStatuses:update', { id, ...updates });
    },

    async delete(id: string): Promise<void> {
        await ipcInvoke('db:vehicleStatuses:delete', { id });
    },

    async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<VehicleStatusRecord>> {
        return ipcInvoke<PaginatedResult<VehicleStatusRecord>>('db:vehicleStatuses:getPaginated', { page, pageSize });
    },
};
