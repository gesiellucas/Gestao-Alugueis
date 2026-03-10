-- =============================================
-- Migration: Vehicle Statuses FK
-- Date: 2026-03-09
-- Description:
--   1. Create vehicle_statuses table
--   2. Seed default statuses
--   3. Add status_id FK column to vehicles
--   4. Migrate existing status text values to status_id
--   5. Drop old status column
--   6. Add indexes, triggers, RLS for vehicle_statuses
-- =============================================

-- 1. Create vehicle_statuses table
CREATE TABLE IF NOT EXISTS vehicle_statuses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6b7280',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 2. Seed default statuses
INSERT INTO vehicle_statuses (id, name, color, is_default) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Disponível',     '#22c55e', true),
  ('00000000-0000-0000-0000-000000000002', 'Alugada',        '#3b82f6', true),
  ('00000000-0000-0000-0000-000000000003', 'Em Manutenção',  '#f59e0b', true),
  ('00000000-0000-0000-0000-000000000004', 'Indisponível',   '#ef4444', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Add status_id column to vehicles (nullable initially for migration)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES vehicle_statuses(id) ON DELETE SET NULL;

-- 4. Migrate existing status text values to status_id
UPDATE vehicles SET status_id = '00000000-0000-0000-0000-000000000001' WHERE status = 'Disponível'   AND status_id IS NULL;
UPDATE vehicles SET status_id = '00000000-0000-0000-0000-000000000002' WHERE status = 'Alugada'      AND status_id IS NULL;
UPDATE vehicles SET status_id = '00000000-0000-0000-0000-000000000003' WHERE status = 'Em Manutenção' AND status_id IS NULL;
UPDATE vehicles SET status_id = '00000000-0000-0000-0000-000000000004' WHERE status = 'Indisponível'  AND status_id IS NULL;

-- Fallback: set any remaining vehicles to 'Disponível'
UPDATE vehicles SET status_id = '00000000-0000-0000-0000-000000000001' WHERE status_id IS NULL;

-- 5. Make status_id NOT NULL now that all rows have been migrated
ALTER TABLE vehicles ALTER COLUMN status_id SET NOT NULL;

-- 6. Drop old status column
ALTER TABLE vehicles DROP COLUMN IF EXISTS status;

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status_id ON vehicles(status_id);

-- 8. Trigger for updated_at on vehicle_statuses
CREATE TRIGGER trg_vehicle_statuses_updated_at
  BEFORE UPDATE ON vehicle_statuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. RLS for vehicle_statuses
ALTER TABLE vehicle_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicle_statuses"
  ON vehicle_statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vehicle_statuses"
  ON vehicle_statuses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update vehicle_statuses"
  ON vehicle_statuses FOR UPDATE TO authenticated USING (true);
