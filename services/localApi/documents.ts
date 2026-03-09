/**
 * Local SQLite documents API
 */
import { ipcInvoke } from '../../lib/ipc';
import { Document } from '../../types';

export const localDocumentsApi = {
    async getAll(): Promise<Document[]> {
        return ipcInvoke<Document[]>('db:documents:getAll');
    },

    async getByParent(parentId: string, originType: 'CONTRACT' | 'WORKSHOP'): Promise<Document[]> {
        return ipcInvoke<Document[]>('db:documents:getByParent', { parentId, originType });
    },

    async create(doc: { parent_id: string; origin_type: 'CONTRACT' | 'WORKSHOP'; file_url: string }): Promise<Document> {
        return ipcInvoke<Document>('db:documents:create', doc);
    },

    async delete(id: string): Promise<void> {
        await ipcInvoke('db:documents:delete', { id });
    },
};
