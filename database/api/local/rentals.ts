/**
 * Supabase rental contracts API
 */
import { supabase } from '../../client/supabase';
import { RentalContract, PaginatedResult } from '../../../types';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localRentalsApi = {
  async getAll(): Promise<RentalContract[]> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data || []) as RentalContract[];
  },

  async getById(id: string): Promise<RentalContract | null> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) throw error;
    return data as RentalContract | null;
  },

  async create(contract: any): Promise<RentalContract> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('rentals')
      .insert({
        ...contract,
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
    return data as RentalContract;
  },

  async update(id: string, updates: any): Promise<RentalContract> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('rentals')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;
    return data as RentalContract;
  },

  async delete(id: string): Promise<void> {
    const user_id = requireUserId();
    const { error } = await supabase
      .from('rentals')
      .update({
        is_deleted: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) throw error;
  },

  async getActive(): Promise<RentalContract[]> {
    const all = await this.getAll();
    return all.filter((c) => c.status === 'ACTIVE');
  },

  async getByVehicle(vehicle_id: string): Promise<RentalContract[]> {
    const all = await this.getAll();
    return all.filter((c) => c.vehicle_id === vehicle_id);
  },

  async getByCustomer(customer_id: string): Promise<RentalContract[]> {
    const all = await this.getAll();
    return all.filter((c) => c.customer_id === customer_id);
  },

  async getActiveByVehicle(vehicle_id: string): Promise<RentalContract | null> {
    const all = await this.getAll();
    return all.find((c) => c.vehicle_id === vehicle_id && c.status === 'ACTIVE') ?? null;
  },

  async end(id: string): Promise<RentalContract> {
    return this.update(id, {
      status: 'ENDED',
      end_date: new Date().toISOString().split('T')[0],
    });
  },

  async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<RentalContract>> {
    const user_id = requireUserId();
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('rentals')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .order('start_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count || 0;
    return {
      data: (data || []) as RentalContract[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
};

