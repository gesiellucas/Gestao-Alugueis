/**
 * Supabase workshops API
 */
import { supabase } from '../../client/supabase';
import { Workshop, PaginatedResult } from '../../../types';

export const localWorkshopsApi = {
    async getAll(): Promise<Workshop[]> {
        const { data, error } = await supabase
            .from('workshops')
            .select('*')
            .eq('is_deleted', 0)
            .order('name');
        
        if (error) throw error;
        return (data || []) as Workshop[];
    },

    async getById(id: string): Promise<Workshop | null> {
        const { data, error } = await supabase
            .from('workshops')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', 0)
            .maybeSingle();

        if (error) throw error;
        return data as Workshop | null;
    },

    async create(workshop: any): Promise<Workshop> {
        const { data, error } = await supabase
            .from('workshops')
            .insert({
                ...workshop,
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
        return data as Workshop;
    },

    async update(id: string, updates: any): Promise<Workshop> {
        const { data, error } = await supabase
            .from('workshops')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Workshop;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('workshops')
            .update({
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<Workshop>> {
        const offset = (page - 1) * pageSize;
        const { data, error, count } = await supabase
            .from('workshops')
            .select('*', { count: 'exact' })
            .eq('is_deleted', 0)
            .order('name')
            .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const total = count || 0;
        return {
            data: (data || []) as Workshop[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    },
};
