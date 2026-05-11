/**
 * Supabase contracts API
 */
import { supabase } from '../../client/supabase';
import { Contract } from '../../../types';

export const localContractsApi = {
    async getAll(): Promise<Contract[]> {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('is_deleted', 0);
        
        if (error) throw error;
        return (data || []) as unknown as Contract[];
    },

    async getById(id: string): Promise<Contract | null> {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', 0)
            .maybeSingle();

        if (error) throw error;
        return data as unknown as Contract | null;
    },

    async getByRental(rental_id: string): Promise<Contract | null> {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('rental_id', rental_id)
            .eq('is_deleted', 0)
            .maybeSingle();

        if (error) throw error;
        return data as unknown as Contract | null;
    },

    async create(contract: { rental_id: string }): Promise<Contract> {
        const { data, error } = await supabase
            .from('contracts')
            .insert({
                ...contract,
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
        return data as unknown as Contract;
    },

    async update(id: string, updates: { rental_id?: string }): Promise<Contract> {
        const { data, error } = await supabase
            .from('contracts')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as Contract;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('contracts')
            .update({
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },
};
