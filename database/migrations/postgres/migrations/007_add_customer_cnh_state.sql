-- ============================================================
-- Migração 007: CNH e Estado no cadastro de clientes
-- Executar no Supabase SQL Editor
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS state        TEXT,
  ADD COLUMN IF NOT EXISTS cnh          TEXT,
  ADD COLUMN IF NOT EXISTS cnh_category TEXT;
