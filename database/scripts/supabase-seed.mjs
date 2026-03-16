#!/usr/bin/env node
/**
 * Seed do banco Supabase remoto.
 * Dados extraídos de database/migrations/sqlite/seed.sql
 * Uso: npm run db:seed
 * Requer: SUPABASE_DB_URL no .env
 */
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('❌  SUPABASE_DB_URL não definida no .env');
  process.exit(1);
}

const now = new Date().toISOString();
const meta = {
  created_at: now,
  updated_at: now,
  updated_by: null,
  device_id: 'seed-device',
  version: 1,
  is_deleted: 0,
  sync_status: 'synced',
};

async function upsert(client, table, rows, conflictCol = 'id') {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');
  const updates = cols
    .filter(c => c !== conflictCol)
    .map(c => `"${c}" = EXCLUDED."${c}"`)
    .join(', ');

  for (const row of rows) {
    const vals = cols.map((_, i) => `$${i + 1}`).join(', ');
    const values = cols.map(c => row[c]);
    await client.query(
      `INSERT INTO ${table} (${colList}) VALUES (${vals})
       ON CONFLICT ("${conflictCol}") DO UPDATE SET ${updates}`,
      values
    );
  }
}

const client = new Client({ connectionString: url });

try {
  await client.connect();
  console.log('🔗 Conectado ao Supabase.\n');

  // ── vehicle_statuses (não está no seed.sql, vem do seed.ts) ──────────────
  console.log('🌱 vehicle_statuses...');
  await upsert(client, 'vehicle_statuses', [
    { id: '1', name: 'Disponível',    color: '#22c55e', is_default: true,  ...meta },
    { id: '2', name: 'Alugada',       color: '#3b82f6', is_default: true,  ...meta },
    { id: '3', name: 'Em Manutenção', color: '#f59e0b', is_default: true,  ...meta },
    { id: '4', name: 'Indisponível',  color: '#ef4444', is_default: true,  ...meta },
  ]);

  // ── roles ────────────────────────────────────────────────────────────────
  console.log('🌱 roles...');
  await upsert(client, 'roles', [
    { id: '1', workshop_id: null, name: 'Gerente',    permissions: JSON.stringify(['*']),                                                  ...meta },
    { id: '2', workshop_id: null, name: 'Oficina',    permissions: JSON.stringify(['veiculos_view', 'oficina_view', 'oficina_edit']),       ...meta },
    { id: '3', workshop_id: null, name: 'Financeiro', permissions: JSON.stringify(['financeiro_view', 'financeiro_edit']),                  ...meta },
  ]);

  // ── app_users ────────────────────────────────────────────────────────────
  console.log('🌱 app_users...');
  await upsert(client, 'app_users', [
    { id: '1', name: 'Gestor Master',    email: 'admin@gclocamoto.com.br',      password: 'admin123',    role_id: '1', ...meta },
    { id: '2', name: 'Roberto Mecânico', email: 'oficina@gclocamoto.com.br',    password: 'oficina123',  role_id: '2', ...meta },
    { id: '3', name: 'Clara Financeiro', email: 'financeiro@gclocamoto.com.br', password: 'financas123', role_id: '3', ...meta },
  ]);

  // ── workshops (seed.sql — 20 registros) ──────────────────────────────────
  console.log('🌱 workshops...');
  await upsert(client, 'workshops', [
    { id: '1',  name: 'Oficina Central Auto',    address: 'Av. Principal, 100',       status: 'ACTIVE', ...meta },
    { id: '2',  name: 'Mecânica do Beto',        address: 'Rua das Flores, 45',       status: 'ACTIVE', ...meta },
    { id: '3',  name: 'Flash Moto Service',      address: 'Rua Veloz, 88',            status: 'ACTIVE', ...meta },
    { id: '4',  name: 'Centro Automotivo Silva', address: 'Av. Getúlio Vargas, 1200', status: 'ACTIVE', ...meta },
    { id: '5',  name: 'Oficina Estrela',         address: 'Rua Saturno, 33',          status: 'ACTIVE', ...meta },
    { id: '6',  name: 'Precision Mechanics',     address: 'Industrial Park, Loja 4',  status: 'ACTIVE', ...meta },
    { id: '7',  name: 'Moto Master GCL',         address: 'Rua das Motos, 10',        status: 'ACTIVE', ...meta },
    { id: '8',  name: 'Oficina do Povo',         address: 'Bairro Operário, S/N',     status: 'ACTIVE', ...meta },
    { id: '9',  name: 'Elite Auto Repair',       address: 'Shopping Center, P1',      status: 'ACTIVE', ...meta },
    { id: '10', name: 'Mecânica Rápida',         address: 'Posto BR Central',         status: 'ACTIVE', ...meta },
    { id: '11', name: 'Auto Check-up',           address: 'Av. Brasil, 500',          status: 'ACTIVE', ...meta },
    { id: '12', name: 'Oficina do Zé',           address: 'Rua da Lama, 20',          status: 'ACTIVE', ...meta },
    { id: '13', name: 'Grand Prix Service',      address: 'Av. Automobilista, 99',    status: 'ACTIVE', ...meta },
    { id: '14', name: 'Moto Tech',               address: 'Rua Eletrônica, 15',       status: 'ACTIVE', ...meta },
    { id: '15', name: 'Oficina 24 Horas',        address: 'Rodovia KM 12',            status: 'ACTIVE', ...meta },
    { id: '16', name: 'Ponto da Manutenção',     address: 'Rua de Baixo, 44',         status: 'ACTIVE', ...meta },
    { id: '17', name: 'Auto Sul',                address: 'Av. Sul, 202',             status: 'ACTIVE', ...meta },
    { id: '18', name: 'Mecânica Norte',          address: 'Av. Norte, 303',           status: 'ACTIVE', ...meta },
    { id: '19', name: 'Garagem do Futuro',       address: 'Rua High-Tech, 1',         status: 'ACTIVE', ...meta },
    { id: '20', name: 'Oficina do Bairro',       address: 'Rua Amizade, 12',          status: 'ACTIVE', ...meta },
  ]);

  // ── vehicle_models (seed.sql — 20 registros) ─────────────────────────────
  console.log('🌱 vehicle_models...');
  await upsert(client, 'vehicle_models', [
    { id: '1',  name: 'CG 160 Titan',   brand: 'Honda',        image_url: null, status: 'ACTIVE', ...meta },
    { id: '2',  name: 'NMAX 160',       brand: 'Yamaha',       image_url: null, status: 'ACTIVE', ...meta },
    { id: '3',  name: 'Bros 160',       brand: 'Honda',        image_url: null, status: 'ACTIVE', ...meta },
    { id: '4',  name: 'PCX 150',        brand: 'Honda',        image_url: null, status: 'ACTIVE', ...meta },
    { id: '5',  name: 'FZ25 Fazer',     brand: 'Yamaha',       image_url: null, status: 'ACTIVE', ...meta },
    { id: '6',  name: 'XRE 300',        brand: 'Honda',        image_url: null, status: 'ACTIVE', ...meta },
    { id: '7',  name: 'Lander 250',     brand: 'Yamaha',       image_url: null, status: 'ACTIVE', ...meta },
    { id: '8',  name: 'Factor 150',     brand: 'Yamaha',       image_url: null, status: 'ACTIVE', ...meta },
    { id: '9',  name: 'Biz 125',        brand: 'Honda',        image_url: null, status: 'ACTIVE', ...meta },
    { id: '10', name: 'Pop 110i',       brand: 'Honda',        image_url: null, status: 'ACTIVE', ...meta },
    { id: '11', name: 'Crosser 150',    brand: 'Yamaha',       image_url: null, status: 'ACTIVE', ...meta },
    { id: '12', name: 'MT-03',          brand: 'Yamaha',       image_url: null, status: 'ACTIVE', ...meta },
    { id: '13', name: 'CB 500X',        brand: 'Honda',        image_url: null, status: 'ACTIVE', ...meta },
    { id: '14', name: 'Versys 300',     brand: 'Kawasaki',     image_url: null, status: 'ACTIVE', ...meta },
    { id: '15', name: 'Ninja 400',      brand: 'Kawasaki',     image_url: null, status: 'ACTIVE', ...meta },
    { id: '16', name: 'Tiger 900',      brand: 'Triumph',      image_url: null, status: 'ACTIVE', ...meta },
    { id: '17', name: 'G 310 GS',       brand: 'BMW',          image_url: null, status: 'ACTIVE', ...meta },
    { id: '18', name: 'Scrambler 400X', brand: 'Triumph',      image_url: null, status: 'ACTIVE', ...meta },
    { id: '19', name: 'R 1250 GS',      brand: 'BMW',          image_url: null, status: 'ACTIVE', ...meta },
    { id: '20', name: 'Himalayan 411',  brand: 'Royal Enfield', image_url: null, status: 'ACTIVE', ...meta },
  ]);

  // ── customers (seed.sql — 20 registros) ──────────────────────────────────
  console.log('🌱 customers...');
  await upsert(client, 'customers', [
    { id: '1',  user_id: '1', name: 'João Silva',     phone: '(11) 98888-7777', cpf: '123.456.789-00', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '2',  user_id: '1', name: 'Maria Oliveira', phone: '(11) 97777-6666', cpf: '234.567.890-11', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '3',  user_id: '1', name: 'Pedro Santos',   phone: '(21) 96666-5555', cpf: '345.678.901-22', active_contract: false, balance_due: 150.00, last_payment_date: null, ...meta },
    { id: '4',  user_id: '1', name: 'Ana Souza',      phone: '(31) 95555-4444', cpf: '456.789.012-33', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '5',  user_id: '1', name: 'Carlos Lima',    phone: '(41) 94444-3333', cpf: '567.890.123-44', active_contract: false, balance_due: 0,      last_payment_date: null, ...meta },
    { id: '6',  user_id: '1', name: 'Fernanda Rocha', phone: '(51) 93333-2222', cpf: '678.901.234-55', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '7',  user_id: '1', name: 'Ricardo Alves',  phone: '(61) 92222-1111', cpf: '789.012.345-66', active_contract: true,  balance_due: 45.50,  last_payment_date: now, ...meta },
    { id: '8',  user_id: '1', name: 'Juliana Costa',  phone: '(71) 91111-0000', cpf: '890.123.456-77', active_contract: false, balance_due: 0,      last_payment_date: null, ...meta },
    { id: '9',  user_id: '1', name: 'Roberto Garcia', phone: '(81) 90000-9999', cpf: '901.234.567-88', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '10', user_id: '1', name: 'Camila Martins', phone: '(91) 89999-8888', cpf: '012.345.678-99', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '11', user_id: '1', name: 'Bruno Ferreira', phone: '(11) 88888-7777', cpf: '111.222.333-44', active_contract: false, balance_due: 200.00, last_payment_date: null, ...meta },
    { id: '12', user_id: '1', name: 'Amanda Lima',    phone: '(22) 87777-6666', cpf: '222.333.444-55', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '13', user_id: '1', name: 'Lucas Pires',    phone: '(33) 86666-5555', cpf: '333.444.555-66', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '14', user_id: '1', name: 'Patrícia Gomes', phone: '(44) 85555-4444', cpf: '444.555.666-77', active_contract: false, balance_due: 0,      last_payment_date: null, ...meta },
    { id: '15', user_id: '1', name: 'Gabriel Souza',  phone: '(55) 84444-3333', cpf: '555.666.777-88', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '16', user_id: '1', name: 'Bárbara Silva',  phone: '(66) 83333-2222', cpf: '666.777.888-99', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '17', user_id: '1', name: 'Rodrigo Melo',   phone: '(77) 82222-1111', cpf: '777.888.999-00', active_contract: false, balance_due: 500.00, last_payment_date: null, ...meta },
    { id: '18', user_id: '1', name: 'Tatiana Dias',   phone: '(88) 81111-0000', cpf: '888.999.000-11', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '19', user_id: '1', name: 'Hugo Ramos',     phone: '(99) 80000-9999', cpf: '999.000.111-22', active_contract: true,  balance_due: 0,      last_payment_date: now, ...meta },
    { id: '20', user_id: '1', name: 'Vanessa Luz',    phone: '(11) 79999-8888', cpf: '000.111.222-33', active_contract: false, balance_due: 0,      last_payment_date: null, ...meta },
  ]);

  // ── vehicles (seed.sql — 20 registros) ───────────────────────────────────
  console.log('🌱 vehicles...');
  await upsert(client, 'vehicles', [
    { id: '1',  plate: 'ABC-1234', model_id: '1',  year: 2023, status_id: '1', mileage: 5000,  current_renter_id: null, default_monthly_rate: 550.00,  image_url: null, ...meta },
    { id: '2',  plate: 'DEF-5678', model_id: '2',  year: 2024, status_id: '2', mileage: 1200,  current_renter_id: '1',  default_monthly_rate: 750.00,  image_url: null, ...meta },
    { id: '3',  plate: 'GHI-9012', model_id: '3',  year: 2022, status_id: '1', mileage: 15000, current_renter_id: null, default_monthly_rate: 600.00,  image_url: null, ...meta },
    { id: '4',  plate: 'JKL-3456', model_id: '1',  year: 2023, status_id: '3', mileage: 8000,  current_renter_id: null, default_monthly_rate: 550.00,  image_url: null, ...meta },
    { id: '5',  plate: 'MNO-7890', model_id: '4',  year: 2024, status_id: '2', mileage: 500,   current_renter_id: '2',  default_monthly_rate: 800.00,  image_url: null, ...meta },
    { id: '6',  plate: 'PQR-1122', model_id: '5',  year: 2021, status_id: '1', mileage: 25000, current_renter_id: null, default_monthly_rate: 700.00,  image_url: null, ...meta },
    { id: '7',  plate: 'STU-3344', model_id: '2',  year: 2023, status_id: '1', mileage: 4500,  current_renter_id: null, default_monthly_rate: 750.00,  image_url: null, ...meta },
    { id: '8',  plate: 'VWX-5566', model_id: '6',  year: 2022, status_id: '2', mileage: 12000, current_renter_id: '4',  default_monthly_rate: 950.00,  image_url: null, ...meta },
    { id: '9',  plate: 'YZA-7788', model_id: '7',  year: 2023, status_id: '1', mileage: 6000,  current_renter_id: null, default_monthly_rate: 850.00,  image_url: null, ...meta },
    { id: '10', plate: 'BBB-9900', model_id: '8',  year: 2020, status_id: '4', mileage: 35000, current_renter_id: null, default_monthly_rate: 450.00,  image_url: null, ...meta },
    { id: '11', plate: 'CCC-1212', model_id: '1',  year: 2024, status_id: '1', mileage: 100,   current_renter_id: null, default_monthly_rate: 550.00,  image_url: null, ...meta },
    { id: '12', plate: 'DDD-3434', model_id: '9',  year: 2023, status_id: '2', mileage: 3500,  current_renter_id: '6',  default_monthly_rate: 400.00,  image_url: null, ...meta },
    { id: '13', plate: 'EEE-5656', model_id: '10', year: 2022, status_id: '1', mileage: 12000, current_renter_id: null, default_monthly_rate: 300.00,  image_url: null, ...meta },
    { id: '14', plate: 'FFF-7878', model_id: '11', year: 2023, status_id: '3', mileage: 9500,  current_renter_id: null, default_monthly_rate: 650.00,  image_url: null, ...meta },
    { id: '15', plate: 'GGG-9090', model_id: '12', year: 2024, status_id: '1', mileage: 50,    current_renter_id: null, default_monthly_rate: 1200.00, image_url: null, ...meta },
    { id: '16', plate: 'HHH-1111', model_id: '13', year: 2023, status_id: '2', mileage: 7800,  current_renter_id: '7',  default_monthly_rate: 1800.00, image_url: null, ...meta },
    { id: '17', plate: 'III-2222', model_id: '17', year: 2024, status_id: '1', mileage: 200,   current_renter_id: null, default_monthly_rate: 1500.00, image_url: null, ...meta },
    { id: '18', plate: 'JJJ-3333', model_id: '20', year: 2022, status_id: '3', mileage: 15000, current_renter_id: null, default_monthly_rate: 1100.00, image_url: null, ...meta },
    { id: '19', plate: 'KKK-4444', model_id: '18', year: 2024, status_id: '2', mileage: 1500,  current_renter_id: '9',  default_monthly_rate: 1400.00, image_url: null, ...meta },
    { id: '20', plate: 'LLL-5555', model_id: '19', year: 2023, status_id: '1', mileage: 5000,  current_renter_id: null, default_monthly_rate: 2500.00, image_url: null, ...meta },
  ]);

  console.log('\n✅ Seed concluído com sucesso!');
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
