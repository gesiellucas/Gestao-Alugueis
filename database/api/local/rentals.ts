/**
 * Local SQLite rental contracts API — mirrors services/api/rentalContracts.ts
 */
import { ipcInvoke } from '../../../lib/ipc';
import { RentalContract } from '../../../types';
import type { InsertDto, UpdateDto } from '../../client/types';

// user_id is read from the current session via Supabase auth in Electron
function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localRentalsApi = {
  async getAll(): Promise<RentalContract[]> {
    const user_id = requireUserId();
    try {
      const result = await ipcInvoke<RentalContract[]>('db:rentals:getAll', { user_id });
      return result;
    } catch (err) {
      throw err;
    }
  },

  async getById(id: string): Promise<RentalContract | null> {
    return ipcInvoke<RentalContract | null>('db:rentals:getById', { id, user_id: requireUserId() });
  },

  async create(contract: Omit<InsertDto<'rentals'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<RentalContract> {
    return ipcInvoke<RentalContract>('db:rentals:create', { ...contract, user_id: requireUserId() });
  },

  async update(id: string, updates: Omit<UpdateDto<'rentals'>, 'user_id' | 'id' | 'device_id' | 'version' | 'is_deleted' | 'sync_status' | 'created_at' | 'updated_at'> & { user_id?: string }): Promise<RentalContract> {
    return ipcInvoke<RentalContract>('db:rentals:update', { ...updates, id, user_id: requireUserId() });
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:rentals:delete', { id, user_id: requireUserId() });
  },

  async getActive(): Promise<RentalContract[]> {
    const all = await this.getAll();
    return all.filter((c) => c.status === 'ACTIVE');
  },

  async getByVehicle(vehicle_id: string): Promise<RentalContract[]> {
    const all = await this.getAll();
    return all.filter((c) => c.vehicle_id === vehicle_id);
  },

  async getByCustomer(customer_id: string): Promise<RentalContract[]> {
    const all = await this.getAll();
    return all.filter((c) => c.customer_id === customer_id);
  },

  async getActiveByVehicle(vehicle_id: string): Promise<RentalContract | null> {
    const all = await this.getAll();
    return all.find((c) => c.vehicle_id === vehicle_id && c.status === 'ACTIVE') ?? null;
  },

  async end(id: string): Promise<RentalContract> {
    return this.update(id, {
      status: 'ENDED',
      end_date: new Date().toISOString().split('T')[0],
    });
  },
};
