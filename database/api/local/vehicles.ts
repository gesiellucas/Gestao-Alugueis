/**
 * Local SQLite vehicle API — mirrors services/api/vehicles.ts
 * Vehicles are shared across all users (no user_id filtering).
 */
import { ipcInvoke } from '../../../lib/ipc';
import { Vehicle, VEHICLE_STATUS_IDS } from '../../../types';
import type { InsertDto, UpdateDto } from '../../client/types';

export const localVehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    try {
      const result = await ipcInvoke<Vehicle[]>('db:vehicles:getAll');
      return result;
    } catch (err) {
      throw err;
    }
  },

  async getById(id: number): Promise<Vehicle | null> {
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

  async update(id: number, updates: UpdateDto<'vehicles'>): Promise<Vehicle> {
    return ipcInvoke<Vehicle>('db:vehicles:update', { ...updates, id });
  },

  async delete(id: number): Promise<void> {
    await ipcInvoke('db:vehicles:delete', { id });
  },

  async getByStatusId(statusId: number): Promise<Vehicle[]> {
    const all = await this.getAll();
    return all.filter((v) => v.status_id === statusId);
  },

  async getAvailable(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.AVAILABLE);
  },

  async getRented(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.RENTED);
  },

  async getInMaintenance(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.MAINTENANCE);
  },

  async updateStatus(id: number, statusId: number): Promise<Vehicle> {
    return this.update(id, { status_id: statusId });
  },

  async updateMileage(id: number, mileage: number): Promise<Vehicle> {
    return this.update(id, { mileage });
  },
};
