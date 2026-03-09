/**
 * Local SQLite vehicle API — mirrors services/api/vehicles.ts
 * Vehicles are shared across all users (no user_id filtering).
 */
import { ipcInvoke } from '../../lib/ipc';
import { Vehicle, VehicleStatus } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

export const localVehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    try {
      const result = await ipcInvoke<Vehicle[]>('db:vehicles:getAll');
      return result;
    } catch (err) {
      throw err;
    }
  },

  async getById(id: string): Promise<Vehicle | null> {
    try {
      const result = await ipcInvoke<Vehicle | null>('db:vehicles:getById', { id });
      return result;
    } catch (err) {
      throw err;
    }
  },

  async create(vehicle: InsertDto<'vehicles'>): Promise<Vehicle> {
    return ipcInvoke<Vehicle>('db:vehicles:create', { ...vehicle });
  },

  async update(id: string, updates: UpdateDto<'vehicles'>): Promise<Vehicle> {
    return ipcInvoke<Vehicle>('db:vehicles:update', { ...updates, id });
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:vehicles:delete', { id });
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
