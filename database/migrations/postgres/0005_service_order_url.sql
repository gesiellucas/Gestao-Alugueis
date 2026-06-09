-- Adiciona coluna service_order_url em maintenance_records
-- Armazena a URL pública do documento HTML da Ordem de Serviço no Supabase Storage

ALTER TABLE maintenance_records
  ADD COLUMN IF NOT EXISTS service_order_url TEXT;
