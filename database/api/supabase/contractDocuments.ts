/**
 * Storage de contratos gerados — bucket "contract-documents" (separado de workshop-documents).
 * Caminho: contract-documents/{rentalId}/{uuid}.docx
 *
 * Tabela documents: origin_type = 'CONTRACT', parent_id = contracts.id
 */
import { supabase } from '../../client/supabase';
import { Document } from '../../../types';

const BUCKET = 'contract-documents';

function mapRow(row: Record<string, unknown>): Document {
  return {
    ...row,
    id: row.id as string,
    parent_id: row.parent_id as string,
    origin_type: 'CONTRACT' as Document['origin_type'],
    file_url: row.file_url as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  } as Document;
}

export const supabaseContractDocumentsApi = {
  async getByContract(contractId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('parent_id', contractId)
      .eq('origin_type', 'CONTRACT')
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },

  async uploadDocx(
    rentalId: string,
    contractId: string,
    docxBlob: Blob,
    templateName: string,
  ): Promise<Document> {
    const timestamp = Date.now();
    const safeName = templateName.replace(/[^a-zA-Z0-9]/g, '_');
    const storagePath = `${rentalId}/${safeName}_${timestamp}.docx`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, docxBlob, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    const fileUrl = urlData.publicUrl;

    const { data, error: insertError } = await supabase
      .from('documents')
      .insert({
        id: crypto.randomUUID(),
        parent_id: contractId,
        origin_type: 'CONTRACT',
        file_url: fileUrl,
        device_id: 'web',
        version: 1,
        is_deleted: 0,
        sync_status: 'synced',
      } as any)
      .select()
      .single();

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw insertError;
    }

    return mapRow(data as Record<string, unknown>);
  },

  async delete(doc: Document): Promise<void> {
    const { error } = await supabase
      .from('documents')
      .update({ is_deleted: 1, updated_at: new Date().toISOString() })
      .eq('id', doc.id);

    if (error) throw error;

    try {
      const url = new URL(doc.file_url);
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length));
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    } catch {
      // Ignora falha de remoção no storage
    }
  },
};
