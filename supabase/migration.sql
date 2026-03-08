-- migration.sql
-- Essa migration adiciona os campos user_id e deleted_at às tabelas existentes do Supabase,
-- cria a nova tabela vehicle_models e refatora a tabela de vehicles para usar model_id.

-- 1. Cria a nova tabela de modelos de veículos
CREATE TABLE IF NOT EXISTS vehicle_models (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL,
  name           TEXT NOT NULL,
  brand          TEXT NOT NULL,
  image_url      TEXT,
  status         TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

-- 2. Adiciona campos de suporte para o modo offline e multi-tenant (user_id e deleted_at) nas tabelas existentes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE rental_contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Atualiza tabela vehicles para usar model_id
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model_id UUID REFERENCES vehicle_models(id) ON DELETE SET NULL;

-- Remove as colunas antigas (pode comentar as duas linhas abaixo caso prefira não dropar em produção ainda)
ALTER TABLE vehicles DROP COLUMN IF EXISTS model;
ALTER TABLE vehicles DROP COLUMN IF EXISTS brand;

-- 4. Criação de índices para melhoria de performance
CREATE INDEX IF NOT EXISTS idx_vehicle_models_user_id ON vehicle_models(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_user_id ON rental_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_user_id ON maintenance_records(user_id);

-- 5. Trigger automatizado para updated_at da nova tabela
CREATE TRIGGER trg_vehicle_models_updated_at
  BEFORE UPDATE ON vehicle_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Configuração do RLS (Row Level Security) para a nova tabela
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (Adapte conforme o padrão das outras tabelas se necessário restringir por user_id)
CREATE POLICY "Authenticated users can read vehicle_models"
  ON vehicle_models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicle_models"
  ON vehicle_models FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicle_models"
  ON vehicle_models FOR UPDATE
  TO authenticated
  USING (true);
