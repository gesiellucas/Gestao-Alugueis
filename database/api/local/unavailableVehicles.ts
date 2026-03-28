/**
 * Supabase unavailable vehicles API
 */
import { supabase } from '../../client/supabase';
import { UnavailableVehicle, PaginatedResult } from '../../../types';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localUnavailableVehiclesApi = {
    async getAll(): Promise<UnavailableVehicle[]> {
        const user_id = requireUserId();
        const { data, error } = await supabase
            .from('unavailable_vehicles')
            .select('*')
            .eq('user_id', user_id)
            .eq('is_deleted', 0)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        return (data || []) as unknown as UnavailableVehicle[];
    },

    async getById(id: string): Promise<UnavailableVehicle | null> {
        const user_id = requireUserId();
        const { data, error } = await supabase
            .from('unavailable_vehicles')
            .select('*')
            .eq('id', id)
            .eq('user_id', user_id)
            .eq('is_deleted', 0)
            .maybeSingle();

        if (error) throw error;
        return data as unknown as UnavailableVehicle | null;
    },

    async create(record: any): Promise<UnavailableVehicle> {
        const user_id = requireUserId();
        const { data, error } = await supabase
            .from('unavailable_vehicles')
            .insert({
                ...record,
                id: crypto.randomUUID(),
                user_id,
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
        return data as unknown as UnavailableVehicle;
    },

    async delete(id: string): Promise<void> {
        const user_id = requireUserId();
        const { error } = await supabase
            .from('unavailable_vehicles')
            .update({
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) throw error;
    },

    async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<UnavailableVehicle>> {
        const user_id = requireUserId();
        const offset = (page - 1) * pageSize;
        const { data, error, count } = await supabase
            .from('unavailable_vehicles')
            .select('*', { count: 'exact' })
            .eq('user_id', user_id)
            .eq('is_deleted', 0)
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const total = count || 0;
        return {
            data: (data || []) as unknown as UnavailableVehicle[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    },
};
