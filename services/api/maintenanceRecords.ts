import { supabase } from '../../lib/supabase';
import { MaintenanceRecord } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

export const maintenanceRecordsApi = {
  // Buscar todos os registros
  async getAll(): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar registro por ID
  async getById(id: string): Promise<MaintenanceRecord | null> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo registro
  async create(record: InsertDto<'maintenance_records'>): Promise<MaintenanceRecord> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar registro
  async update(id: string, updates: UpdateDto<'maintenance_records'>): Promise<MaintenanceRecord> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar registro
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar registros abertos (em andamento)
  async getOpen(): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('status', 'OPEN')
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar registros concluídos
  async getCompleted(): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('completion_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar registros por veículo
  async getByVehicle(vehicle_id: string): Promise<MaintenanceRecord[]> {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('vehicle_id', vehicle_id)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Finalizar manutenção
  async complete(id: string, cost: number = 0): Promise<MaintenanceRecord> {
    return this.update(id, {
      status: 'COMPLETED',
      completion_date: new Date().toISOString(),
      cost,
    });
  },

  // Buscar manutenções do dia
  async getToday(): Promise<MaintenanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .gte('entry_date', today)
      .order('entry_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
