import { supabase } from '../../lib/supabase';
import { Customer } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

export const customersApi = {
  // Buscar todos os clientes
  async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Buscar cliente por ID
  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo cliente
  async create(customer: InsertDto<'customers'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar cliente
  async update(id: string, updates: UpdateDto<'customers'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar cliente
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar clientes com contrato ativo
  async getWithActiveContract(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('active_contract', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // Buscar clientes com débito
  async getWithDebt(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .gt('balance_due', 0)
      .order('balance_due', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Atualizar saldo devedor
  async updateBalance(id: string, balance_due: number): Promise<Customer> {
    return this.update(id, {
      balance_due,
      last_payment_date: new Date().toISOString().split('T')[0],
    });
  },

  // Buscar por CPF
  async getByCpf(cpf: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('cpf', cpf)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },
};
