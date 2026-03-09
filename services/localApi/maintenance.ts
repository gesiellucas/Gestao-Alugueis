/**
 * Local SQLite maintenance records API — mirrors services/api/maintenanceRecords.ts
 */
import { ipcInvoke } from '../../lib/ipc';
import { MaintenanceRecord } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localMaintenanceApi = {
  async getAll(): Promise<MaintenanceRecord[]> {
    const userId = requireUserId();
    try {
      const result = await ipcInvoke<MaintenanceRecord[]>('db:maintenance:getAll', { userId });
      return result;
    } catch (err) {
      throw err;
    }
  },

  async getById(id: string): Promise<MaintenanceRecord | null> {
    return ipcInvoke<MaintenanceRecord | null>('db:maintenance:getById', { id, userId: requireUserId() });
  },

  async create(record: InsertDto<'maintenance_records'>): Promise<MaintenanceRecord> {
    return ipcInvoke<MaintenanceRecord>('db:maintenance:create', { ...record, userId: requireUserId() });
  },

  async update(id: string, updates: UpdateDto<'maintenance_records'>): Promise<MaintenanceRecord> {
    return ipcInvoke<MaintenanceRecord>('db:maintenance:update', { ...updates, id, userId: requireUserId() });
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:maintenance:delete', { id, userId: requireUserId() });
  },

  async getOpen(): Promise<MaintenanceRecord[]> {
    const all = await this.getAll();
    return all.filter((r) => r.status === 'OPEN');
  },

  async getCompleted(): Promise<MaintenanceRecord[]> {
    const all = await this.getAll();
    return all.filter((r) => r.status === 'COMPLETED');
  },

  async getByVehicle(vehicle_id: string): Promise<MaintenanceRecord[]> {
    const all = await this.getAll();
    return all.filter((r) => r.vehicle_id === vehicle_id);
  },

  async complete(id: string, cost: number = 0): Promise<MaintenanceRecord> {
    return this.update(id, {
      status: 'COMPLETED',
      completion_date: new Date().toISOString(),
      cost,
    });
  },

  async getToday(): Promise<MaintenanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await this.getAll();
    return all.filter((r) => r.entry_date >= today);
  },
};
