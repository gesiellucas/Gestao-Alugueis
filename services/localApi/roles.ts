import { ipcInvoke } from '../../lib/ipc';
import { Role } from '../../types';

export const localRolesApi = {
    async getAll(): Promise<Role[]> {
        return ipcInvoke<Role[]>('db:roles:getAll');
    },

    async create(role: { name: string; permissions: string[]; workshop_id?: number | null }): Promise<Role> {
        return ipcInvoke<Role>('db:roles:create', role);
    },

    async update(id: number, updates: { name: string; permissions: string[]; workshop_id?: number | null }): Promise<Role> {
        return ipcInvoke<Role>('db:roles:update', { id, ...updates });
    },

    async delete(id: number): Promise<void> {
        await ipcInvoke('db:roles:delete', { id });
    }
};
