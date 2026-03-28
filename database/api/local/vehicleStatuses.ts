/**
 * Supabase vehicle statuses API
 */
import { supabase } from '../../client/supabase';
import { VehicleStatusRecord, PaginatedResult } from '../../../types';

export const localVehicleStatusesApi = {
    async getAll(): Promise<VehicleStatusRecord[]> {
        const { data, error } = await supabase
            .from('vehicle_statuses')
            .select('*')
            .eq('is_deleted', 0)
            .order('name');
        
        if (error) throw error;
        return (data || []) as VehicleStatusRecord[];
    },

    async getById(id: string): Promise<VehicleStatusRecord | null> {
        const { data, error } = await supabase
            .from('vehicle_statuses')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', 0)
            .maybeSingle();

        if (error) throw error;
        return data as VehicleStatusRecord | null;
    },

    async create(status: any): Promise<VehicleStatusRecord> {
        const { data, error } = await supabase
            .from('vehicle_statuses')
            .insert({
                ...status,
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
        return data as VehicleStatusRecord;
    },

    async update(id: string, updates: any): Promise<VehicleStatusRecord> {
        const { data, error } = await supabase
            .from('vehicle_statuses')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as VehicleStatusRecord;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('vehicle_statuses')
            .update({
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<VehicleStatusRecord>> {
        const offset = (page - 1) * pageSize;
        const { data, error, count } = await supabase
            .from('vehicle_statuses')
            .select('*', { count: 'exact' })
            .eq('is_deleted', 0)
            .order('name')
            .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const total = count || 0;
        return {
            data: (data || []) as VehicleStatusRecord[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    },
};
