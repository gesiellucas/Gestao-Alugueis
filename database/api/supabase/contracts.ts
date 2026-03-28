/**
 * Supabase contracts API
 * Relação 1:1 com rentals — um aluguel pode ter um contrato.
 */
import { supabase } from '../../client/supabase';
import { Contract, RentalContract } from '../../../types';
import { ipcInvoke, isElectron } from '../../../lib/ipc';

function mapRow(row: Record<string, unknown>): Contract {
  return {
    ...row,
    id: row.id as string,
    rental_id: row.rental_id as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Contract;
}

export const supabaseContractsApi = {
  /**
   * Busca o contrato de um aluguel. Retorna null se não existir.
   */
  async getByRental(rentalId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('rental_id', rentalId)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRow(data as Record<string, unknown>) : null;
  },

  /**
   * Cria um contrato vinculado a um aluguel.
   */
  async create(rentalId: string): Promise<Contract> {
    const { data, error: insertError } = await supabase
      .from('contracts')
      .insert({
        id: crypto.randomUUID(),
        rental_id: rentalId,
        device_id: 'api-server', // Or some other identifier
        version: 1,
        is_deleted: 0,
        sync_status: 'synced'
      } as any)
      .select()
      .single();

    if (insertError) throw insertError;
    return mapRow(data as Record<string, unknown>);
  },

  /**
   * Garante que existe um contrato para o aluguel — cria se necessário.
   */
  async ensureForRental(rental: RentalContract): Promise<Contract> {
    const existing = await supabaseContractsApi.getByRental(rental.id);
    if (existing) return existing;
    return supabaseContractsApi.create(rental.id);
  },
};

