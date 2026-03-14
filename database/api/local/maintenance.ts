/**
 * Local SQLite maintenance records API — mirrors services/api/maintenanceRecords.ts
 */
import { ipcInvoke } from '../../../lib/ipc';
import { MaintenanceRecord } from '../../../types';
import type { InsertDto, UpdateDto } from '../../client/types';

// user_id is read from the current session via Supabase auth in Electron
function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localMaintenanceApi = {
  async getAll(): Promise<MaintenanceRecord[]> {
    const user_id = requireUserId();
    try {
      const result = await ipcInvoke<MaintenanceRecord[]>('db:maintenance:getAll', { user_id });
      return result;
    } catch (err) {
      throw err;
    }
  },

  async getById(id: string): Promise<MaintenanceRecord | null> {
    return ipcInvoke<MaintenanceRecord | null>('db:maintenance:getById', { id, user_id: requireUserId() });
  },

  async create(record: Omit<InsertDto<'maintenance_records'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<MaintenanceRecord> {
    return ipcInvoke<MaintenanceRecord>('db:maintenance:create', { ...record, user_id: requireUserId() });
  },

  async update(id: string, updates: Omit<UpdateDto<'maintenance_records'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<MaintenanceRecord> {
    return ipcInvoke<MaintenanceRecord>('db:maintenance:update', { ...updates, id, user_id: requireUserId() });
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:maintenance:delete', { id, user_id: requireUserId() });
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
