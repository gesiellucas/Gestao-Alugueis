/**
 * Supabase customer API
 */
import { supabase } from '../../client/supabase';
import { Customer, PaginatedResult } from '../../../types';

function requireUserId(): string {
  const userId = typeof localStorage !== 'undefined'
    ? localStorage.getItem('electron_user_id')
    : null;
  if (!userId) throw new Error('Usuário não autenticado no contexto local.');
  return userId;
}

export const localCustomersApi = {
  async getAll(): Promise<Customer[]> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .order('name');

    if (error) throw error;
    return (data || []) as Customer[];
  },

  async getById(id: string): Promise<Customer | null> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) throw error;
    return data as Customer | null;
  },

  async create(customer: any): Promise<Customer> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customer,
        id: crypto.randomUUID(),
        user_id: customer.user_id || user_id,
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
    return data as Customer;
  },

  async update(id: string, updates: any): Promise<Customer> {
    const user_id = requireUserId();
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;
    return data as Customer;
  },

  async delete(id: string): Promise<void> {
    const user_id = requireUserId();
    const { error } = await supabase
      .from('customers')
      .update({
        is_deleted: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) throw error;
  },

  async getWithActiveContract(): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => c.active_contract);
  },

  async getWithDebt(): Promise<Customer[]> {
    const all = await this.getAll();
    return all.filter((c) => c.balance_due > 0).sort((a, b) => b.balance_due - a.balance_due);
  },

  async updateBalance(id: string, balance_due: number): Promise<Customer> {
    return this.update(id, {
      balance_due,
      last_payment_date: new Date().toISOString().split('T')[0],
    });
  },

  async getByCpf(cpf: string): Promise<Customer | null> {
    const all = await this.getAll();
    return all.find((c) => c.cpf === cpf) ?? null;
  },

  async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<Customer>> {
    const user_id = requireUserId();
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('user_id', user_id)
      .eq('is_deleted', 0)
      .order('name')
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count || 0;
    return {
      data: (data || []) as Customer[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
};
