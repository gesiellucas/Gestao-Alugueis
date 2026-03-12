/**
 * Local SQLite vehicle models API — mirrors services/api/vehicleModels.ts
 * Vehicle models are shared across all users (no user_id filtering).
 */
import { ipcInvoke } from '../../lib/ipc';
import { VehicleModel } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

export const localVehicleModelsApi = {
    async getAll(): Promise<VehicleModel[]> {
        try {
            const result = await ipcInvoke<VehicleModel[]>('db:vehicleModels:getAll');
            return result;
        } catch (err) {
            throw err;
        }
    },

    async getById(id: number): Promise<VehicleModel | null> {
        return ipcInvoke<VehicleModel | null>('db:vehicleModels:getById', { id });
    },

    async create(model: InsertDto<'vehicle_models'>): Promise<VehicleModel> {
        return ipcInvoke<VehicleModel>('db:vehicleModels:create', { ...model });
    },

    async update(id: number, updates: UpdateDto<'vehicle_models'>): Promise<VehicleModel> {
        return ipcInvoke<VehicleModel>('db:vehicleModels:update', { ...updates, id });
    },

    async delete(id: number): Promise<void> {
        await ipcInvoke('db:vehicleModels:delete', { id });
    },
};
