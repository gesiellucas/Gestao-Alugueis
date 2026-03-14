/**
 * Local SQLite vehicle models API — mirrors services/api/vehicleModels.ts
 * Vehicle models are shared across all users (no user_id filtering).
 */
import { ipcInvoke } from '../../../lib/ipc';
import { VehicleModel } from '../../../types';

export const localVehicleModelsApi = {
    async getAll(): Promise<VehicleModel[]> {
        try {
            const result = await ipcInvoke<VehicleModel[]>('db:vehicleModels:getAll');
            return result;
        } catch (err) {
            throw err;
        }
    },

    async getById(id: string): Promise<VehicleModel | null> {
        return ipcInvoke<VehicleModel | null>('db:vehicleModels:getById', { id });
    },

    async create(model: { name: string; brand: string; image_url?: string | null; status?: string }): Promise<VehicleModel> {
        return ipcInvoke<VehicleModel>('db:vehicleModels:create', { ...model });
    },

    async update(id: string, updates: { name?: string; brand?: string; image_url?: string | null; status?: string }): Promise<VehicleModel> {
        return ipcInvoke<VehicleModel>('db:vehicleModels:update', { ...updates, id });
    },

    async delete(id: string): Promise<void> {
        await ipcInvoke('db:vehicleModels:delete', { id });
    },
};
