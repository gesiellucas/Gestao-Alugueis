import { supabase } from '../../lib/supabase';
import { RentalContract } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

export const rentalContractsApi = {
  // Buscar todos os contratos
  async getAll(): Promise<RentalContract[]> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar contrato por ID
  async getById(id: string): Promise<RentalContract | null> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo contrato
  async create(contract: InsertDto<'rental_contracts'>): Promise<RentalContract> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .insert(contract)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar contrato
  async update(id: string, updates: UpdateDto<'rental_contracts'>): Promise<RentalContract> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar contrato
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('rental_contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar contratos ativos
  async getActive(): Promise<RentalContract[]> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar contratos por veículo
  async getByVehicle(vehicle_id: string): Promise<RentalContract[]> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar contratos por cliente
  async getByCustomer(customer_id: string): Promise<RentalContract[]> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('*')
      .eq('customer_id', customer_id)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar contrato ativo de um veículo
  async getActiveByVehicle(vehicle_id: string): Promise<RentalContract | null> {
    const { data, error } = await supabase
      .from('rental_contracts')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .eq('status', 'ACTIVE')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  // Encerrar contrato
  async end(id: string): Promise<RentalContract> {
    return this.update(id, {
      status: 'ENDED',
      end_date: new Date().toISOString().split('T')[0],
    });
  },
};
