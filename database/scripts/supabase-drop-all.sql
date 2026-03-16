-- =============================================
-- GC Locamoto - Drop All (Supabase)
-- Apaga toda a estrutura do banco remoto
-- =============================================

-- Desabilita triggers temporariamente para evitar problemas de FK
SET session_replication_role = replica;

-- Tabelas (CASCADE garante que FKs não bloqueiem)
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS vehicle_models CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS vehicle_statuses CASCADE;
DROP TABLE IF EXISTS workshops CASCADE;
DROP TABLE IF EXISTS config CASCADE;
DROP TABLE IF EXISTS sync_metadata CASCADE;

-- Tabela de controle do Drizzle
DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;

-- Reabilita triggers
SET session_replication_role = DEFAULT;

-- ENUMs customizados
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS maintenance_type CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS contract_status CASCADE;
DROP TYPE IF EXISTS maintenance_status CASCADE;
DROP TYPE IF EXISTS workshop_status CASCADE;
DROP TYPE IF EXISTS document_origin CASCADE;

-- Funções
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
