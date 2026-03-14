/**
 * Supabase documents API
 *
 * Arquivos são armazenados na Supabase Storage no bucket "contract-documents".
 * Caminho: contract-documents/{contractId}/{uuid}-{filename}
 *
 * A tabela `documents` usa parent_id = contract.id e origin_type = 'CONTRACT'.
 */
import { supabase } from '../../client/supabase';
import { Document } from '../../../types';

const BUCKET = 'contract-documents';

function mapRow(row: Record<string, unknown>): Document {
  return {
    id: row.id as unknown as number,
    parent_id: row.parent_id as unknown as number,
    origin_type: row.origin_type as 'CONTRACT' | 'WORKSHOP',
    file_url: row.file_url as string,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

export const supabaseDocumentsApi = {
  /**
   * Busca todos os documentos de um contrato.
   */
  async getByContract(contractId: number): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('parent_id', contractId)
      .eq('origin_type', 'CONTRACT')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },

  /**
   * Faz upload de um arquivo para a Supabase Storage e salva o registro
   * na tabela `documents` vinculado ao contrato.
   *
   * @param contractId - ID do contrato (documents.parent_id)
   * @param file       - Arquivo selecionado pelo usuário
   * @returns          - Documento criado com a URL pública do arquivo
   */
  async uploadAndCreate(contractId: number, file: File): Promise<Document> {
    // Gera um nome único para evitar colisões
    const ext = file.name.split('.').pop() ?? '';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext ? `.${ext}` : ''}`;
    const storagePath = `${contractId}/${uniqueName}`;

    // 1. Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2. Obtém a URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // 3. Salva registro na tabela documents
    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        parent_id: contractId,
        origin_type: 'CONTRACT',
        file_url: fileUrl,
      } as any)
      .select()
      .single();

    if (insertError) {
      // Tenta remover o arquivo do storage em caso de falha no banco
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw insertError;
    }

    return mapRow(data as Record<string, unknown>);
  },

  /**
   * Remove o documento do banco e o arquivo do Storage.
   */
  async delete(doc: Document): Promise<void> {
    // Soft-delete no banco
    const { error: dbError } = await supabase
      .from('documents')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', doc.id);

    if (dbError) throw dbError;

    // Remove arquivo do Storage (extrai o caminho a partir da URL pública)
    try {
      const url = new URL(doc.file_url);
      // URL pública: .../storage/v1/object/public/{bucket}/{path}
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length));
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    } catch {
      // Ignora erros de remoção do storage — o soft-delete já foi feito
    }
  },
};
