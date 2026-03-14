import { ipcInvoke } from '../../../lib/ipc';
import { AppUser } from '../../../types';

export const localUsersApi = {
    async getAll(): Promise<AppUser[]> {
        return ipcInvoke<AppUser[]>('db:users:getAll');
    },

    async create(user: { name: string; email: string; password?: string; role_id: string }): Promise<AppUser> {
        return ipcInvoke<AppUser>('db:users:create', user);
    },

    async update(id: string, updates: Partial<Omit<AppUser, 'id' | 'role' | 'created_at' | 'updated_at'>>): Promise<void> {
        return ipcInvoke<void>('db:users:update', { id, ...updates });
    },

    async delete(id: string): Promise<void> {
        await ipcInvoke('db:users:delete', { id });
    },

    async login(email: string, password?: string): Promise<AppUser | null> {
        return ipcInvoke<AppUser | null>('db:users:login', { email, password });
    }
};
