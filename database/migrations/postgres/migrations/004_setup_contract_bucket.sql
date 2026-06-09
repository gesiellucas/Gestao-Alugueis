-- ============================================================
-- Migração 004: Campos de template no contracts + bucket storage
-- Executar no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar colunas à tabela contracts
ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS template_id    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS template_name  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS form_data      TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'rascunho';

-- 2. Criar bucket de contratos (via Supabase Dashboard > Storage > New bucket)
--    Nome: contract-documents
--    Public: false (acesso apenas autenticado)
--
-- Ou via API:
--   const { data, error } = await supabase.storage.createBucket('contract-documents', {
--     public: false,
--     allowedMimeTypes: [
--       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
--     ]
--   });

-- 3. Policy de storage (execute após criar o bucket):
-- INSERT INTO storage.policies (name, bucket_id, operation, definition)
-- VALUES
--   ('Authenticated users can upload contracts', 'contract-documents', 'INSERT',
--    'auth.role() = ''authenticated'''),
--   ('Authenticated users can read contracts', 'contract-documents', 'SELECT',
--    'auth.role() = ''authenticated'''),
--   ('Authenticated users can delete contracts', 'contract-documents', 'DELETE',
--    'auth.role() = ''authenticated''');
