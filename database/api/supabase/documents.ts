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
const UNAVAILABLE_BUCKET = 'unavailable-documents';

function getBucket(originType: Document['origin_type']): string {
  return originType === 'UNAVAILABLE_VEHICLE' ? UNAVAILABLE_BUCKET : BUCKET;
}

function mapRow(row: Record<string, unknown>): Document {
  return {
    ...row,
    id: row.id as string,
    parent_id: row.parent_id as string,
    origin_type: row.origin_type as Document['origin_type'],
    file_url: row.file_url as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Document;
}

export const supabaseDocumentsApi = {
  /**
   * Busca todos os documentos de um contrato.
   */
  async getByContract(contractId: string): Promise<Document[]> {
    return this.getByParent(contractId, 'CONTRACT');
  },

  async getByParent(parentId: string, originType: Document['origin_type']): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('parent_id', parentId)
      .eq('origin_type', originType)
      .eq('is_deleted', 0)
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
  async uploadAndCreate(contractId: string, file: File, originType: Document['origin_type'] = 'CONTRACT'): Promise<Document> {
    // Gera um nome único para evitar colisões
    const ext = file.name.split('.').pop() ?? '';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext ? `.${ext}` : ''}`;
    const storagePath = `${contractId}/${uniqueName}`;

    const bucket = getBucket(originType);

    // 1. Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 2. Obtém a URL pública
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    // 3. Salva registro na tabela documents
    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        id: crypto.randomUUID(),
        parent_id: contractId,
        origin_type: originType,
        file_url: fileUrl,
        device_id: 'web',
        version: 1,
        is_deleted: 0,
        sync_status: 'synced',
      } as any)
      .select()
      .single();

    if (insertError) {
      // Tenta remover o arquivo do storage em caso de falha no banco
      await supabase.storage.from(bucket).remove([storagePath]);
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
      .update({ is_deleted: 1, updated_at: new Date().toISOString() })
      .eq('id', doc.id);

    if (dbError) throw dbError;

    // Remove arquivo do Storage (extrai o caminho a partir da URL pública)
    try {
      const url = new URL(doc.file_url);
      const docBucket = doc.file_url.includes(UNAVAILABLE_BUCKET) ? UNAVAILABLE_BUCKET : BUCKET;
      const marker = `/object/public/${docBucket}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length));
        await supabase.storage.from(docBucket).remove([storagePath]);
      }
    } catch {
      // Ignora erros de remoção do storage — o soft-delete já foi feito
    }
  },
};
