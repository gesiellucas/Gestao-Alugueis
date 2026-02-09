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
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  active_contract BOOLEAN NOT NULL DEFAULT false,
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  last_payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Tabela: vehicles (Veículos / Frota)
-- =============================================
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  brand TEXT NOT NULL,
  year INTEGER NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'Disponível',
  mileage INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  current_renter_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  default_monthly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Tabela: rental_contracts (Contratos de Aluguel)
-- =============================================
CREATE TABLE rental_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rate NUMERIC(10, 2) NOT NULL,
  status contract_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Tabela: maintenance_records (Registros de Manutenção)
-- =============================================
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_plate TEXT NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  completion_date TIMESTAMPTZ,
  mechanic_name TEXT NOT NULL,
  description TEXT NOT NULL,
  type maintenance_type NOT NULL,
  cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status maintenance_status NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- Índices para performance
-- =============================================
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_current_renter ON vehicles(current_renter_id);
CREATE INDEX idx_customers_cpf ON customers(cpf);
CREATE INDEX idx_customers_active_contract ON customers(active_contract);
CREATE INDEX idx_rental_contracts_vehicle ON rental_contracts(vehicle_id);
CREATE INDEX idx_rental_contracts_customer ON rental_contracts(customer_id);
CREATE INDEX idx_rental_contracts_status ON rental_contracts(status);
CREATE INDEX idx_maintenance_vehicle ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_records(status);
CREATE INDEX idx_maintenance_entry_date ON maintenance_records(entry_date);

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

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rental_contracts_updated_at
  BEFORE UPDATE ON rental_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_maintenance_records_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para todos os usuários autenticados
CREATE POLICY "Authenticated users can read app_users"
  ON app_users FOR SELECT
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

CREATE POLICY "Authenticated users can read rental_contracts"
  ON rental_contracts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read maintenance_records"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (true);

-- Política: Permitir escrita para todos os usuários autenticados
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

CREATE POLICY "Authenticated users can insert rental_contracts"
  ON rental_contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rental_contracts"
  ON rental_contracts FOR UPDATE
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
