-- =============================================
-- Migration: Database Schema Restructuring
-- Date: 2026-03-09
-- Description: 
--   1. Create workshops table
--   2. Rename rental_contracts → rentals
--   3. Create contracts table (child of rentals)
--   4. Add workshop_id FK to maintenance_records
--   5. Create documents table (polymorphic)
--   6. Add indexes, triggers, RLS for new tables
-- =============================================

-- 1. Create enum types for new tables
DO $$ BEGIN
  CREATE TYPE workshop_status AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE document_origin AS ENUM ('CONTRACT', 'WORKSHOP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create workshops table
CREATE TABLE IF NOT EXISTS workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  status workshop_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 3. Rename rental_contracts → rentals
ALTER TABLE IF EXISTS rental_contracts RENAME TO rentals;

-- Rename old indexes to match new table name
ALTER INDEX IF EXISTS idx_rental_contracts_user_id RENAME TO idx_rentals_user_id;
ALTER INDEX IF EXISTS idx_rental_contracts_vehicle RENAME TO idx_rentals_vehicle;
ALTER INDEX IF EXISTS idx_rental_contracts_customer RENAME TO idx_rentals_customer;
ALTER INDEX IF EXISTS idx_rental_contracts_status RENAME TO idx_rentals_status;

-- 4. Create contracts table (1:0..1 with rentals)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contracts_rental ON contracts(rental_id);

-- 5. Add workshop_id to maintenance_records
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_workshop ON maintenance_records(workshop_id);

-- 6. Create documents table (polymorphic attachments)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  origin_type document_origin NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id, origin_type);

-- 7. Triggers for updated_at on new tables
CREATE TRIGGER trg_workshops_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Rename the old trigger on rental_contracts (now rentals)
DROP TRIGGER IF EXISTS trg_rental_contracts_updated_at ON rentals;
CREATE TRIGGER trg_rentals_updated_at
  BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. RLS for new tables
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Workshops policies
CREATE POLICY "Authenticated users can read workshops"
  ON workshops FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert workshops"
  ON workshops FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update workshops"
  ON workshops FOR UPDATE TO authenticated USING (true);

-- Contracts policies
CREATE POLICY "Authenticated users can read contracts"
  ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contracts"
  ON contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contracts"
  ON contracts FOR UPDATE TO authenticated USING (true);

-- Documents policies
CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE TO authenticated USING (true);

-- Rename old RLS policies on rentals (formerly rental_contracts)
-- Drop old policies and create new ones with correct names
DROP POLICY IF EXISTS "Authenticated users can read rental_contracts" ON rentals;
DROP POLICY IF EXISTS "Authenticated users can insert rental_contracts" ON rentals;
DROP POLICY IF EXISTS "Authenticated users can update rental_contracts" ON rentals;

CREATE POLICY "Authenticated users can read rentals"
  ON rentals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert rentals"
  ON rentals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update rentals"
  ON rentals FOR UPDATE TO authenticated USING (true);
