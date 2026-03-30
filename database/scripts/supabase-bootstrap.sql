-- =============================================
-- GC Locamoto - Bootstrap Script (Supabase)
-- Cria toda a estrutura se não existir
-- =============================================

-- 1. Tabelas de Configuração e Controle
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_metadata (
  table_name TEXT PRIMARY KEY,
  last_sync_at TIMESTAMPTZ
);

-- 2. Tabelas Principais
CREATE TABLE IF NOT EXISTS workshops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS vehicle_statuses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  workshop_id TEXT REFERENCES workshops(id),
  name TEXT NOT NULL,
  permissions TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  active_contract BOOLEAN NOT NULL DEFAULT false,
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  last_payment_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS vehicle_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  plate TEXT NOT NULL,
  model_id TEXT REFERENCES vehicle_models(id),
  year NUMERIC NOT NULL,
  status_id TEXT NOT NULL REFERENCES vehicle_statuses(id),
  mileage NUMERIC NOT NULL DEFAULT 0,
  current_renter_id TEXT REFERENCES customers(id),
  default_monthly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS rentals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  start_date TEXT NOT NULL,
  end_date TEXT,
  monthly_rate NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  rental_id TEXT NOT NULL REFERENCES rentals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS maintenance_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  workshop_id TEXT REFERENCES workshops(id),
  vehicle_plate TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  completion_date TEXT,
  mechanic_name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS unavailable_vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
  status_type TEXT NOT NULL, -- 'STOLEN' | 'TOTAL_LOSS'
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  parent_id TEXT NOT NULL,
  origin_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT,
  device_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON customers(cpf);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_id ON vehicles(status_id);
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_vehicle_id ON rentals(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rentals_customer_id ON rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_rental_id ON contracts(rental_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_user_id ON maintenance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_workshop_id ON maintenance_records(workshop_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_vehicles_user_id ON unavailable_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_unavailable_vehicles_vehicle_id ON unavailable_vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id, origin_type);

-- 4. Funções e Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('workshops', 'vehicle_statuses', 'roles', 'app_users', 'customers', 'vehicle_models', 'vehicles', 'rentals', 'contracts', 'maintenance_records', 'unavailable_vehicles', 'documents')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
    END LOOP;
END $$;

-- 5. Row Level Security (RLS)
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('config', 'sync_metadata', 'workshops', 'vehicle_statuses', 'roles', 'app_users', 'customers', 'vehicle_models', 'vehicles', 'rentals', 'contracts', 'maintenance_records', 'unavailable_vehicles', 'documents')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- Policies Idempotentes
DO $$ 
DECLARE
    r record;
BEGIN
    -- Leitura para todos os autenticados em todas as tabelas
    FOR r IN (
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('config', 'sync_metadata', 'workshops', 'vehicle_statuses', 'roles', 'app_users', 'customers', 'vehicle_models', 'vehicles', 'rentals', 'contracts', 'maintenance_records', 'unavailable_vehicles', 'documents')
    )
    LOOP
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = format('Allow read for authenticated on %I', r.table_name)) THEN
            EXECUTE format('CREATE POLICY "Allow read for authenticated on %I" ON %I FOR SELECT TO authenticated USING (true)', r.table_name, r.table_name);
        END IF;

        -- Admin/Authenticated podem inserir e atualizar (simplificado para bootstrap)
        -- Nota: tabelas de controle como config e sync_metadata também incluímos aqui para permitir operação via app
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = format('Allow insert for authenticated on %I', r.table_name)) THEN
            EXECUTE format('CREATE POLICY "Allow insert for authenticated on %I" ON %I FOR INSERT TO authenticated WITH CHECK (true)', r.table_name, r.table_name);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = format('Allow update for authenticated on %I', r.table_name)) THEN
            EXECUTE format('CREATE POLICY "Allow update for authenticated on %I" ON %I FOR UPDATE TO authenticated USING (true)', r.table_name, r.table_name);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = format('Allow delete for authenticated on %I', r.table_name)) THEN
            EXECUTE format('CREATE POLICY "Allow delete for authenticated on %I" ON %I FOR DELETE TO authenticated USING (true)', r.table_name, r.table_name);
        END IF;
    END LOOP;
END $$;

-- 6. Storage Buckets
-- Buckets (públicos por padrão no seu sistema)
INSERT INTO storage.buckets (id, name, public)
VALUES ('unavailable-documents', 'unavailable-documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('workshop-documents', 'workshop-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de Storage (Idempotentes)
DO $$ 
BEGIN
    -- unavailable-documents
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public read access on unavailable-documents') THEN
        CREATE POLICY "Public read access on unavailable-documents" ON storage.objects FOR SELECT USING (bucket_id = 'unavailable-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow upload to unavailable-documents') THEN
        CREATE POLICY "Allow upload to unavailable-documents" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'unavailable-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow update in unavailable-documents') THEN
        CREATE POLICY "Allow update in unavailable-documents" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'unavailable-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow delete from unavailable-documents') THEN
        CREATE POLICY "Allow delete from unavailable-documents" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'unavailable-documents');
    END IF;

    -- contract-documents
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public read access on contract-documents') THEN
        CREATE POLICY "Public read access on contract-documents" ON storage.objects FOR SELECT USING (bucket_id = 'contract-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow upload to contract-documents') THEN
        CREATE POLICY "Allow upload to contract-documents" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'contract-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow update in contract-documents') THEN
        CREATE POLICY "Allow update in contract-documents" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'contract-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow delete from contract-documents') THEN
        CREATE POLICY "Allow delete from contract-documents" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'contract-documents');
    END IF;

    -- workshop-documents
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Public read access on workshop-documents') THEN
        CREATE POLICY "Public read access on workshop-documents" ON storage.objects FOR SELECT USING (bucket_id = 'workshop-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow upload to workshop-documents') THEN
        CREATE POLICY "Allow upload to workshop-documents" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'workshop-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow update in workshop-documents') THEN
        CREATE POLICY "Allow update in workshop-documents" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'workshop-documents');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow delete from workshop-documents') THEN
        CREATE POLICY "Allow delete from workshop-documents" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'workshop-documents');
    END IF;
END $$;
