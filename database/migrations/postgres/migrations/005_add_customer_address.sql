-- ============================================================
-- Migração 005: Campos de endereço no cadastro de clientes
-- Executar no Supabase SQL Editor
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS address      TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city         TEXT;
