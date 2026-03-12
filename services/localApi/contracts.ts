/**
 * Local SQLite contracts API
 */
import { ipcInvoke } from '../../lib/ipc';
import { Contract } from '../../types';

export const localContractsApi = {
    async getAll(): Promise<Contract[]> {
        return ipcInvoke<Contract[]>('db:contracts:getAll');
    },

    async getById(id: number): Promise<Contract | null> {
        return ipcInvoke<Contract | null>('db:contracts:getById', { id });
    },

    async getByRental(rental_id: number): Promise<Contract | null> {
        return ipcInvoke<Contract | null>('db:contracts:getByRental', { rental_id });
    },

    async create(contract: { rental_id: number }): Promise<Contract> {
        return ipcInvoke<Contract>('db:contracts:create', contract);
    },

    async update(id: number, updates: { rental_id?: number }): Promise<Contract> {
        return ipcInvoke<Contract>('db:contracts:update', { id, ...updates });
    },

    async delete(id: number): Promise<void> {
        await ipcInvoke('db:contracts:delete', { id });
    },
};
