/**
 * Supabase contracts API
 * Relação 1:1 com rentals — um aluguel pode ter um contrato.
 */
import { supabase } from '../../client/supabase';
import { Contract } from '../../../types';

function mapRow(row: Record<string, unknown>): Contract {
  return {
    id: Number(row.id),
    rental_id: Number(row.rental_id),
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export const supabaseContractsApi = {
  /**
   * Busca o contrato de um aluguel. Retorna null se não existir.
   */
  async getByRental(rentalId: number): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('rental_id', rentalId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRow(data as Record<string, unknown>) : null;
  },

  /**
   * Cria um contrato vinculado a um aluguel.
   */
  async create(rentalId: number): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert({ rental_id: rentalId })
      .select()
      .single();

    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },

  /**
   * Garante que existe um contrato para o aluguel — cria se necessário.
   * Retorna o contrato existente ou recém-criado.
   */
  async ensureForRental(rentalId: number): Promise<Contract> {
    const existing = await supabaseContractsApi.getByRental(rentalId);
    if (existing) return existing;
    return supabaseContractsApi.create(rentalId);
  },
};
