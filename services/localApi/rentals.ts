/**
 * Local SQLite rental contracts API — mirrors services/api/rentalContracts.ts
 */
import { ipcInvoke } from '../../lib/ipc';
import { RentalContract } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localRentalsApi = {
  async getAll(): Promise<RentalContract[]> {
    const userId = requireUserId();
    try {
      const result = await ipcInvoke<RentalContract[]>('db:rentals:getAll', { userId });
      return result;
    } catch (err) {
      throw err;
    }
  },

  async getById(id: string): Promise<RentalContract | null> {
    return ipcInvoke<RentalContract | null>('db:rentals:getById', { id, userId: requireUserId() });
  },

  async create(contract: InsertDto<'rentals'>): Promise<RentalContract> {
    return ipcInvoke<RentalContract>('db:rentals:create', { ...contract, userId: requireUserId() });
  },

  async update(id: string, updates: UpdateDto<'rentals'>): Promise<RentalContract> {
    return ipcInvoke<RentalContract>('db:rentals:update', { ...updates, id, userId: requireUserId() });
  },

  async delete(id: string): Promise<void> {
    await ipcInvoke('db:rentals:delete', { id, userId: requireUserId() });
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
