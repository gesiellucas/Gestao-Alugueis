/**
 * Supabase workshop documents API
 *
 * Fotos de manutenção armazenadas na Supabase Storage no bucket "workshop-documents".
 * Caminho: workshop-documents/{maintenanceRecordId}/{uuid}.{ext}
 *
 * Tipos de documento:
 *   - WORKSHOP       → fotos da manutenção
 *   - SERVICE_ORDER  → PDF da Ordem de Serviço
 *
 * Ambos usam parent_id = maintenanceRecord.id na tabela `documents`.
 */
import { supabase } from '../../client/supabase';
import { Document } from '../../../types';

const BUCKET = 'workshop-documents';

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

export const supabaseWorkshopDocumentsApi = {
  async getByMaintenance(maintenanceId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('parent_id', maintenanceId)
      .eq('origin_type', 'WORKSHOP')
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },

  async getByMaintenanceIds(ids: string[]): Promise<Document[]> {
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in('parent_id', ids)
      .eq('origin_type', 'WORKSHOP')
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },

  async getServiceOrders(maintenanceId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('parent_id', maintenanceId)
      .eq('origin_type', 'SERVICE_ORDER')
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
  },

  async uploadAndCreate(maintenanceId: string, file: File): Promise<Document> {
    const ext = file.name.split('.').pop() ?? '';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext ? `.${ext}` : ''}`;
    const storagePath = `${maintenanceId}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
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
        parent_id: maintenanceId,
        origin_type: 'WORKSHOP',
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

  async uploadServiceOrderPdf(maintenanceId: string, pdfBlob: Blob, osNumber: string): Promise<Document> {
    const timestamp = Date.now();
    const storagePath = `${maintenanceId}/OS-${osNumber}-${timestamp}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, pdfBlob, {
        contentType: 'image/jpeg',
        upsert: true,
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
        parent_id: maintenanceId,
        origin_type: 'SERVICE_ORDER',
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
    const { error: dbError } = await supabase
      .from('documents')
      .update({ is_deleted: 1, updated_at: new Date().toISOString() })
      .eq('id', doc.id);

    if (dbError) throw dbError;

    try {
      const url = new URL(doc.file_url);
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx !== -1) {
        const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length));
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    } catch {
      // Ignora erros de remoção do storage
    }
  },
};
