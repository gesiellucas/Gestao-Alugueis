/**
 * Local SQLite workshops API
 */
import { ipcInvoke } from '../../../lib/ipc';
import { Workshop } from '../../../types';

export const localWorkshopsApi = {
    async getAll(): Promise<Workshop[]> {
        return ipcInvoke<Workshop[]>('db:workshops:getAll');
    },

    async getById(id: string): Promise<Workshop | null> {
        return ipcInvoke<Workshop | null>('db:workshops:getById', { id });
    },

    async create(workshop: { name: string; address?: string; status?: string }): Promise<Workshop> {
        return ipcInvoke<Workshop>('db:workshops:create', workshop);
    },

    async update(id: string, updates: { name?: string; address?: string; status?: string }): Promise<Workshop> {
        return ipcInvoke<Workshop>('db:workshops:update', { id, ...updates });
    },

    async delete(id: string): Promise<void> {
        await ipcInvoke('db:workshops:delete', { id });
    },
};
