/**
 * Supabase documents API
 */
import { supabase } from '../../client/supabase';
import { Document } from '../../../types';

export const localDocumentsApi = {
    async getAll(): Promise<Document[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('is_deleted', 0);
        
        if (error) throw error;
        return (data || []) as Document[];
    },

    async getByParent(parentId: string): Promise<Document[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('parent_id', parentId)
            .eq('is_deleted', 0);
        
        if (error) throw error;
        return (data || []) as Document[];
    },

    async create(doc: any): Promise<Document> {
        const { data, error } = await supabase
            .from('documents')
            .insert({
                ...doc,
                id: crypto.randomUUID(),
                device_id: 'browser',
                version: 1,
                is_deleted: 0,
                sync_status: 'synced',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as Document;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('documents')
            .update({
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },
};
