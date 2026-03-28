/**
 * Supabase maintenance records API
 */
import { supabase } from '../../client/supabase';
import { MaintenanceRecord, PaginatedResult } from '../../../types';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localMaintenanceApi = {
  async getAll(): Promise<MaintenanceRecord[]> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as MaintenanceRecord[];
  },

  async getById(id: string): Promise<MaintenanceRecord | null> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as MaintenanceRecord | null;
  },

  async create(record: any): Promise<MaintenanceRecord> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('maintenance_records')
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
    return data as unknown as MaintenanceRecord;
  },

  async update(id: string, updates: any): Promise<MaintenanceRecord> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('maintenance_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as MaintenanceRecord;
  },

  async delete(id: string): Promise<void> {
    const user_id = requireUserId();
    const { error } = await supabase
      .from('maintenance_records')
      .update({
        is_deleted: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) throw error;
  },

  async getOpen(): Promise<MaintenanceRecord[]> {
    const all = await this.getAll();
    return all.filter((r) => r.status === 'OPEN');
  },

  async getCompleted(): Promise<MaintenanceRecord[]> {
    const all = await this.getAll();
    return all.filter((r) => r.status === 'COMPLETED');
  },

  async getByVehicle(vehicle_id: string): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .eq('is_deleted', 0)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as MaintenanceRecord[];
  },

  async complete(id: string, cost: number = 0): Promise<MaintenanceRecord> {
    return this.update(id, {
      status: 'COMPLETED',
      completion_date: new Date().toISOString(),
      cost,
    });
  },

  async getToday(): Promise<MaintenanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .gte('entry_date', today)
      .eq('is_deleted', 0);

    if (error) throw error;
    return (data || []) as unknown as MaintenanceRecord[];
  },

  async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<MaintenanceRecord>> {
    const user_id = requireUserId();
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('maintenance_records')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .order('entry_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count || 0;
    return {
      data: (data || []) as unknown as MaintenanceRecord[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
};
