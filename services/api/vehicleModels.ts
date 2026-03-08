import { supabase } from '../../lib/supabase';
import { VehicleModel } from '../../types';
import type { InsertDto, UpdateDto } from '../../types/database';

export const vehicleModelsApi = {
    // Buscar todos os modelos
    async getAll(): Promise<VehicleModel[]> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    // Buscar modelo por ID
    async getById(id: string): Promise<VehicleModel | null> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Criar novo modelo
    async create(model: InsertDto<'vehicle_models'>): Promise<VehicleModel> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .insert(model)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar modelo
    async update(id: string, updates: UpdateDto<'vehicle_models'>): Promise<VehicleModel> {
        const { data, error } = await supabase
            .from('vehicle_models')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Deletar modelo
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('vehicle_models')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
