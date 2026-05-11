/**
 * Supabase contracts API
 * Cada contrato gerado fica vinculado a um rental_id.
 */
import { supabase } from '../../client/supabase';
import { Contract, ContratoStatus } from '../../../types';

function mapRow(row: Record<string, unknown>): Contract {
  return {
    ...row,
    id: row.id as string,
    rental_id: row.rental_id as string,
    template_id: (row.template_id as string) ?? '',
    template_name: (row.template_name as string) ?? '',
    form_data: (() => {
      try { return JSON.parse((row.form_data as string) ?? '{}'); } catch { return {}; }
    })(),
    status: ((row.status as string) ?? 'rascunho') as ContratoStatus,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Contract;
}

export interface CreateContractPayload {
  rental_id: string;
  template_id: string;
  template_name: string;
  form_data: Record<string, string>;
  status?: ContratoStatus;
}

export const supabaseContractsApi = {
  /** Retorna todos os contratos de um aluguel (múltiplos templates). */
  async getByRental(rentalId: string): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('rental_id', rentalId)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },

  /** Retorna o contrato mais recente de um aluguel (compatibilidade com AluguelDetalhePage). */
  async getLatestByRental(rentalId: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('rental_id', rentalId)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRow(data as Record<string, unknown>) : null;
  },

  /** Garante que existe ao menos um contrato para o aluguel — cria vazio se necessário. */
  async ensureForRental(rental: { id: string }): Promise<Contract> {
    const existing = await supabaseContractsApi.getLatestByRental(rental.id);
    if (existing) return existing;
    return supabaseContractsApi.create({
      rental_id: rental.id,
      template_id: '',
      template_name: '',
      form_data: {},
      status: 'rascunho',
    });
  },

  async getAll(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },

  async getById(id: string): Promise<Contract | null> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', 0)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRow(data as Record<string, unknown>) : null;
  },

  async create(payload: CreateContractPayload): Promise<Contract> {
    const { data, error } = await supabase
      .from('contracts')
      .insert({
        id: crypto.randomUUID(),
        rental_id: payload.rental_id,
        template_id: payload.template_id,
        template_name: payload.template_name,
        form_data: JSON.stringify(payload.form_data),
        status: payload.status ?? 'ativo',
        device_id: 'web',
        version: 1,
        is_deleted: 0,
        sync_status: 'synced',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return mapRow(data as Record<string, unknown>);
  },

  async updateStatus(id: string, status: ContratoStatus): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contracts')
      .update({ is_deleted: 1, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
