/**
 * Supabase contracts API
 * Relação 1:1 com rentals — um aluguel pode ter um contrato.
 */
import { supabase } from '../../client/supabase';
import { Contract, RentalContract } from '../../../types';
import { ipcInvoke, isElectron } from '../../../lib/ipc';

function mapRow(row: Record<string, unknown>): Contract {
  return {
    id: row.id as unknown as number,
    rental_id: row.rental_id as unknown as number,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ id: crypto.randomUUID(), rental_id: rentalId } as any)
      .select()
      .single();

    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },

  /**
   * Garante que existe um contrato para o aluguel — cria se necessário.
   * Aciona o motor de sincronização completo para garantir que o aluguel
   * e suas dependências (cliente, veículo) existam no Supabase primeiro.
   */
  async ensureForRental(rental: RentalContract): Promise<Contract> {
    // Tenta forçar a sincronização via IPC (Electron)
    if (isElectron()) {
      try {
        await ipcInvoke('sync:force');
      } catch (err) {
        console.error('Falha ao forçar sincronização via IPC:', err);
      }
    }

    const existing = await supabaseContractsApi.getByRental(rental.id);
    if (existing) return existing;
    return supabaseContractsApi.create(rental.id);
  },
};
