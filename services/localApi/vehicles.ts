/**
 * Local SQLite vehicle API — mirrors services/api/vehicles.ts
 */
import { ipcInvoke } from '../../lib/ipc';
import { Vehicle, VehicleStatus } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localVehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    return ipcInvoke<Vehicle[]>('db:vehicles:getAll', { userId: requireUserId() });
  },

  async getById(id: string): Promise<Vehicle | null> {
    return ipcInvoke<Vehicle | null>('db:vehicles:getById', { id, userId: requireUserId() });
  },

  async create(vehicle: InsertDto<'vehicles'>): Promise<Vehicle> {
    return ipcInvoke<Vehicle>('db:vehicles:create', { ...vehicle, userId: requireUserId() });
  },

  async update(id: string, updates: UpdateDto<'vehicles'>): Promise<Vehicle> {
    return ipcInvoke<Vehicle>('db:vehicles:update', { ...updates, id, userId: requireUserId() });
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:vehicles:delete', { id, userId: requireUserId() });
  },

  async getByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    const all = await this.getAll();
    return all.filter((v) => v.status === status);
  },

  async getAvailable(): Promise<Vehicle[]> {
    return this.getByStatus(VehicleStatus.AVAILABLE);
  },

  async getRented(): Promise<Vehicle[]> {
    return this.getByStatus(VehicleStatus.RENTED);
  },

  async getInMaintenance(): Promise<Vehicle[]> {
    return this.getByStatus(VehicleStatus.MAINTENANCE);
  },

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    return this.update(id, { status });
  },

  async updateMileage(id: string, mileage: number): Promise<Vehicle> {
    return this.update(id, { mileage });
  },
};
