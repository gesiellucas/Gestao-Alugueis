-- =============================================
-- GC Loca Moto - Schema do Banco de Dados
-- Gestão de Locação de Motos
-- =============================================

-- Tipos ENUM customizados
CREATE TYPE vehicle_status AS ENUM (
  'Disponível',
  'Alugada',
  'Em Manutenção',
  'Indisponível'
);

CREATE TYPE maintenance_type AS ENUM (
  'Revisão Periódica',
  'Corretiva/Quebra',
  'Troca de Óleo',
  'Troca de Pneu',
  'Vistoria de Entrada'
);

CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'MECHANIC',
  'BILLING'
);

CREATE TYPE contract_status AS ENUM (
  'ACTIVE',
  'ENDED'
);

CREATE TYPE maintenance_status AS ENUM (
  'OPEN',
  'COMPLETED'
);

CREATE TYPE workshop_status AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE document_origin AS ENUM (
  'CONTRACT',
  'WORKSHOP'
);

-- =============================================
-- Tabela: workshops (Oficinas)
-- =============================================
CREATE TABLE workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  status workshop_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Tabela: app_users (Usuários do sistema)
-- =============================================
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'BILLING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Tabela: customers (Clientes / Parceiros)
-- =============================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  active_contract BOOLEAN NOT NULL DEFAULT false,
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  last_payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Tabela: vehicle_models (Modelos de Veículos)
-- =============================================
CREATE TABLE vehicle_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Tabela: vehicles (Veículos / Frota)
-- =============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE,
  model_id UUID REFERENCES vehicle_models(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'Disponível',
  mileage INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  current_renter_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  default_monthly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Tabela: rentals (Alugueis)
-- =============================================
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rate NUMERIC(10, 2) NOT NULL,
  status contract_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Tabela: contracts (Contratos)
-- =============================================
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Tabela: maintenance_records (Registros de Manutenção)
-- =============================================
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
  vehicle_plate TEXT NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  completion_date TIMESTAMPTZ,
  mechanic_name TEXT NOT NULL,
  description TEXT NOT NULL,
  type maintenance_type NOT NULL,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status maintenance_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Tabela: documents (Documentos)
-- =============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL,
  origin_type document_origin NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- Índices para performance
-- =============================================
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_rentals_user_id ON rentals(user_id);
CREATE INDEX idx_maintenance_records_user_id ON maintenance_records(user_id);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_current_renter ON vehicles(current_renter_id);
CREATE INDEX idx_customers_cpf ON customers(cpf);
CREATE INDEX idx_customers_active_contract ON customers(active_contract);
CREATE INDEX idx_rentals_vehicle ON rentals(vehicle_id);
CREATE INDEX idx_rentals_customer ON rentals(customer_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_contracts_rental ON contracts(rental_id);
CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_workshop ON maintenance_records(workshop_id);
CREATE INDEX idx_maintenance_status ON maintenance_records(status);
CREATE INDEX idx_maintenance_entry_date ON maintenance_records(entry_date);
CREATE INDEX idx_documents_parent ON documents(parent_id, origin_type);

-- =============================================
-- Trigger para updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_users_updated_at
  BEFORE UPDATE ON app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vehicle_models_updated_at
  BEFORE UPDATE ON vehicle_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rentals_updated_at
  BEFORE UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_maintenance_records_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_workshops_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para todos os usuários autenticados
CREATE POLICY "Authenticated users can read app_users"
  ON app_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read vehicle_models"
  ON vehicle_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read rentals"
  ON rentals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read maintenance_records"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read workshops"
  ON workshops FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

-- Política: Permitir escrita para todos os usuários autenticados
CREATE POLICY "Authenticated users can insert vehicle_models"
  ON vehicle_models FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicle_models"
  ON vehicle_models FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rentals"
  ON rentals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rentals"
  ON rentals FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance_records"
  ON maintenance_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance_records"
  ON maintenance_records FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert workshops"
  ON workshops FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update workshops"
  ON workshops FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true);
