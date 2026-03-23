-- =============================================
-- Storage: Bucket "unavailable-documents"
-- Armazena fotos e documentos de veículos
-- marcados como Roubada ou Perda Total (PT).
-- =============================================

-- 1. Criar o bucket (público para leitura de URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('unavailable-documents', 'unavailable-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies de Storage

-- SELECT: qualquer pessoa pode ler (bucket público)
CREATE POLICY "Public read access on unavailable-documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'unavailable-documents');

-- INSERT: anon e authenticated podem fazer upload
CREATE POLICY "Allow upload to unavailable-documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'unavailable-documents');

-- UPDATE: anon e authenticated podem atualizar
CREATE POLICY "Allow update in unavailable-documents"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'unavailable-documents');

-- DELETE: anon e authenticated podem remover
CREATE POLICY "Allow delete from unavailable-documents"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'unavailable-documents');
