-- Adiciona coluna `code` em vehicle_statuses como chave semântica estável
-- Permite que o frontend derive IDs por código em vez de strings hardcoded

ALTER TABLE vehicle_statuses
  ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '';

-- Atualiza os registros padrão do seed
UPDATE vehicle_statuses SET code = 'AVAILABLE'   WHERE id = '1';
UPDATE vehicle_statuses SET code = 'RENTED'      WHERE id = '2';
UPDATE vehicle_statuses SET code = 'MAINTENANCE' WHERE id = '3';
UPDATE vehicle_statuses SET code = 'UNAVAILABLE' WHERE id = '4';

-- Insere os status especiais caso não existam
INSERT INTO vehicle_statuses (id, name, code, color, is_default, created_at, updated_at, device_id, version, is_deleted, sync_status)
VALUES
  ('5', 'Roubada', 'STOLEN',  '#7c3aed', false, now(), now(), 'seed-device', 1, 0, 'synced'),
  ('6', 'PT',      'TOTALED', '#6b7280', false, now(), now(), 'seed-device', 1, 0, 'synced')
ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code;
