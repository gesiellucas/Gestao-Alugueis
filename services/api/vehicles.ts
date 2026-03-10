import { supabase } from '../../lib/supabase';
import { Vehicle, VEHICLE_STATUS_IDS } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

export const vehiclesApi = {
  // Buscar todos os veículos
  async getAll(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar veículo por ID
  async getById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Criar novo veículo
  async create(vehicle: InsertDto<'vehicles'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar veículo
  async update(id: string, updates: UpdateDto<'vehicles'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar veículo
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Buscar veículos por status_id
  async getByStatusId(statusId: string): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)')
      .eq('status_id', statusId)
      .order('plate');

    if (error) throw error;
    return data || [];
  },

  // Buscar veículos disponíveis
  async getAvailable(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.AVAILABLE);
  },

  // Buscar veículos alugados
  async getRented(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.RENTED);
  },

  // Buscar veículos em manutenção
  async getInMaintenance(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.MAINTENANCE);
  },

  // Atualizar status do veículo
  async updateStatus(id: string, statusId: string): Promise<Vehicle> {
    return this.update(id, { status_id: statusId });
  },

  // Atualizar quilometragem
  async updateMileage(id: string, mileage: number): Promise<Vehicle> {
    return this.update(id, { mileage });
  },
};
