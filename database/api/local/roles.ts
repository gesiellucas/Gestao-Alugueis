/**
 * Supabase roles API
 */
import { supabase } from '../../client/supabase';
import { Role } from '../../../types';

export const localRolesApi = {
    async getAll(): Promise<Role[]> {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .eq('is_deleted', 0)
            .order('name');
        
        if (error) throw error;
        return (data || []).map(r => ({
            ...r,
            permissions: typeof r.permissions === 'string' ? JSON.parse(r.permissions) : r.permissions
        })) as Role[];
    },

    async getById(id: string): Promise<Role | null> {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', 0)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            ...data,
            permissions: typeof data.permissions === 'string' ? JSON.parse(data.permissions) : data.permissions
        } as Role;
    },

    async create(role: any): Promise<Role> {
        const { data, error } = await supabase
            .from('roles')
            .insert({
                ...role,
                permissions: Array.isArray(role.permissions) ? JSON.stringify(role.permissions) : role.permissions,
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
        return {
            ...data,
            permissions: typeof data.permissions === 'string' ? JSON.parse(data.permissions) : data.permissions
        } as Role;
    },

    async update(id: string, updates: any): Promise<Role> {
        const { data, error } = await supabase
            .from('roles')
            .update({
                ...updates,
                permissions: Array.isArray(updates.permissions) ? JSON.stringify(updates.permissions) : updates.permissions,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return {
            ...data,
            permissions: typeof data.permissions === 'string' ? JSON.parse(data.permissions) : data.permissions
        } as Role;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('roles')
            .update({
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },
};
