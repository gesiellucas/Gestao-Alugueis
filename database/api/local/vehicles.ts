/**
 * Supabase vehicle API
 */
import { supabase } from '../../client/supabase';
import { Vehicle, VEHICLE_STATUS_IDS, PaginatedResult } from '../../../types';

export const localVehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)')
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Vehicle[];
  },

  async getById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)')
      .eq('id', id)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Vehicle | null;
  },

  async create(vehicle: any): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({
        ...vehicle,
        id: crypto.randomUUID(),
        device_id: 'browser',
        version: 1,
        is_deleted: 0,
        sync_status: 'synced',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)')
      .single();

    if (error) throw error;
    return data as unknown as Vehicle;
  },

  async update(id: string, updates: any): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)')
      .single();

    if (error) throw error;
    return data as unknown as Vehicle;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .update({
        is_deleted: 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getByStatusId(statusId: string): Promise<Vehicle[]> {
    const all = await this.getAll();
    return all.filter((v) => v.status_id === statusId);
  },

  async getAvailable(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.AVAILABLE);
  },

  async getRented(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.RENTED);
  },

  async getInMaintenance(): Promise<Vehicle[]> {
    return this.getByStatusId(VEHICLE_STATUS_IDS.MAINTENANCE);
  },

  async updateStatus(id: string, statusId: string): Promise<Vehicle> {
    return this.update(id, { status_id: statusId });
  },

  async updateMileage(id: string, mileage: number): Promise<Vehicle> {
    return this.update(id, { mileage });
  },

  async getPaginated(page: number, pageSize: number): Promise<PaginatedResult<Vehicle>> {
    const offset = (page - 1) * pageSize;

    const { data, error, count } = await supabase
      .from('vehicles')
      .select('*, model:vehicle_models(*), vehicleStatus:vehicle_statuses(*)', { count: 'exact' })
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count || 0;
    return {
      data: (data || []) as unknown as Vehicle[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  },
};
