import { supabase } from '../../client/supabase';
import { AppUser } from '../../../types';

export const localUsersApi = {
    async getAll(): Promise<AppUser[]> {
        const { data, error } = await supabase
            .from('app_users')
            .select('*, role:roles(*)')
            .eq('is_deleted', 0);
        
        if (error) throw error;
        return (data || []).map(u => ({
            ...u,
            role: u.role ? {
                ...u.role,
                permissions: typeof u.role.permissions === 'string' 
                    ? JSON.parse(u.role.permissions) 
                    : u.role.permissions
            } : undefined
        })) as AppUser[];
    },

    async create(user: { name: string; email: string; password?: string; role_id: string }): Promise<AppUser> {
        const { data, error } = await supabase
            .from('app_users')
            .insert({
                ...user,
                id: crypto.randomUUID(),
                device_id: 'browser',
                version: 1,
                is_deleted: 0,
                sync_status: 'synced',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select('*, role:roles(*)')
            .single();

        if (error) throw error;
        return {
            ...data,
            role: data.role ? {
                ...data.role,
                permissions: typeof data.role.permissions === 'string' 
                    ? JSON.parse(data.role.permissions) 
                    : data.role.permissions
            } : undefined
        } as AppUser;
    },

    async update(id: string, updates: Partial<Omit<AppUser, 'id' | 'role' | 'created_at' | 'updated_at'>>): Promise<void> {
        const { error } = await supabase
            .from('app_users')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('app_users')
            .update({ 
                is_deleted: 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
    },

    async login(email: string, password?: string): Promise<AppUser | null> {
        let query = supabase
            .from('app_users')
            .select('*, role:roles(*)')
            .eq('email', email)
            .eq('is_deleted', 0);
        
        if (password) {
            query = query.eq('password', password);
        }

        const { data, error } = await query.maybeSingle();
        
        if (error) throw error;
        if (!data) return null;

        return {
            ...data,
            role: data.role ? {
                ...data.role,
                permissions: typeof data.role.permissions === 'string' 
                    ? JSON.parse(data.role.permissions) 
                    : data.role.permissions
            } : undefined
        } as AppUser;
    }
};
