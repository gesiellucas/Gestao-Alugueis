/**
 * Local SQLite documents API
 */
import { ipcInvoke } from '../../lib/ipc';
import { Document } from '../../types';

export const localDocumentsApi = {
    async getAll(): Promise<Document[]> {
        return ipcInvoke<Document[]>('db:documents:getAll');
    },

    async getByParent(parent_id: number, origin_type: 'CONTRACT' | 'WORKSHOP'): Promise<Document[]> {
        return ipcInvoke<Document[]>('db:documents:getByParent', { parent_id, origin_type });
    },

    async create(doc: { parent_id: number; origin_type: 'CONTRACT' | 'WORKSHOP'; file_url: string }): Promise<Document> {
        return ipcInvoke<Document>('db:documents:create', doc);
    },

    async delete(id: number): Promise<void> {
        await ipcInvoke('db:documents:delete', { id });
    },
};
