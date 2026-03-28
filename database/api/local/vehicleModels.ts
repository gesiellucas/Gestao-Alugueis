/**
 * Supabase vehicle models API
 */
import { supabase } from '../../client/supabase';
import { VehicleModel, PaginatedResult } from '../../../types';

export const localVehicleModelsApi = {
    async getAll(): Promise<VehicleModel[]> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .select('*')
            .eq('is_deleted', 0)
            .order('name');
        
        if (error) throw error;
        return (data || []) as VehicleModel[];
    },

    async getById(id: string): Promise<VehicleModel | null> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', 0)
            .maybeSingle();

        if (error) throw error;
        return data as VehicleModel | null;
    },

    async create(model: any): Promise<VehicleModel> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .insert({
                ...model,
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
        return data as VehicleModel;
    },

    async update(id: string, updates: any): Promise<VehicleModel> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as VehicleModel;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('vehicle_models')
            .update({
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<VehicleModel>> {
        const offset = (page - 1) * pageSize;
        const { data, error, count } = await supabase
            .from('vehicle_models')
            .select('*', { count: 'exact' })
            .eq('is_deleted', 0)
            .order('name')
            .range(offset, offset + pageSize - 1);

        if (error) throw error;

        const total = count || 0;
        return {
            data: (data || []) as VehicleModel[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    },
};
