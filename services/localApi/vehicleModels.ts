import { ipcInvoke } from '../../lib/ipc';
import { VehicleModel } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

function requireUserId(): string {
    const userId = typeof localStorage !== 'undefined'
        ? localStorage.getItem('electron_user_id')
        : null;
    if (!userId) throw new Error('Usuário não autenticado no contexto local.');
    return userId;
}

export const localVehicleModelsApi = {
    async getAll(): Promise<VehicleModel[]> {
        return ipcInvoke<VehicleModel[]>('db:vehicleModels:getAll', { userId: requireUserId() });
    },

    async getById(id: string): Promise<VehicleModel | null> {
        return ipcInvoke<VehicleModel | null>('db:vehicleModels:getById', { id, userId: requireUserId() });
    },

    async create(model: InsertDto<'vehicle_models'>): Promise<VehicleModel> {
        return ipcInvoke<VehicleModel>('db:vehicleModels:create', { ...model, userId: requireUserId() });
    },

    async update(id: string, updates: UpdateDto<'vehicle_models'>): Promise<VehicleModel> {
        return ipcInvoke<VehicleModel>('db:vehicleModels:update', { ...updates, id, userId: requireUserId() });
    },

    async delete(id: string): Promise<void> {
        await ipcInvoke('db:vehicleModels:delete', { id, userId: requireUserId() });
    },
};
