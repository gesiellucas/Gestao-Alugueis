import { sql } from 'drizzle-orm';
import {
  customers,
  vehicleModels,
  vehicles,
  workshops,
  vehicleStatuses,
  roles,
  appUsers
} from '../schema/sqlite';
import type { DrizzleDb } from '../client/sqlite';

export function runSeed(db: DrizzleDb): void {
  const now = new Date().toISOString();

  // 1. Status de veículos padrão
  const statusCount = db.select({ n: sql<number>`count(*)` }).from(vehicleStatuses).get();
  if ((statusCount?.n ?? 0) === 0) {
    db.insert(vehicleStatuses).values([
      { id: 1, name: 'Disponível',      color: '#22c55e', is_default: 1, created_at: now, updated_at: now, dirty: 1 },
      { id: 2, name: 'Alugada',          color: '#3b82f6', is_default: 1, created_at: now, updated_at: now, dirty: 1 },
      { id: 3, name: 'Em Manutenção',    color: '#f59e0b', is_default: 1, created_at: now, updated_at: now, dirty: 1 },
      { id: 4, name: 'Indisponível',     color: '#ef4444', is_default: 1, created_at: now, updated_at: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }

  // 2. Roles e usuários padrão
  const rolesCount = db.select({ n: sql<number>`count(*)` }).from(roles).get();
  if ((rolesCount?.n ?? 0) === 0) {
    db.insert(roles).values([
      { id: 1, workshop_id: null, name: 'Gerente',     permissions: JSON.stringify(['*']),                                                      created_at: now, updated_at: now },
      { id: 2, workshop_id: null, name: 'Oficina',     permissions: JSON.stringify(['veiculos_view', 'oficina_view', 'oficina_edit']),           created_at: now, updated_at: now },
      { id: 3, workshop_id: null, name: 'Financeiro',  permissions: JSON.stringify(['financeiro_view', 'financeiro_edit']),                      created_at: now, updated_at: now },
    ]).onConflictDoNothing().run();

    db.insert(appUsers).values([
      { id: 1, name: 'Gestor Master',    email: 'admin@gclocamoto.com.br',      password: 'admin123',    role_id: 1, created_at: now, updated_at: now },
      { id: 2, name: 'Roberto Mecânico', email: 'oficina@gclocamoto.com.br',    password: 'oficina123',  role_id: 2, created_at: now, updated_at: now },
      { id: 3, name: 'Clara Financeiro', email: 'financeiro@gclocamoto.com.br', password: 'financas123', role_id: 3, created_at: now, updated_at: now },
    ]).onConflictDoNothing().run();
  }

  // 3. Oficinas (Workshops)
  const workshopCount = db.select({ n: sql<number>`count(*)` }).from(workshops).get();
  if ((workshopCount?.n ?? 0) < 5) {
    db.insert(workshops).values([
      { id: 1, name: 'Oficina Central Auto', address: 'Av. Principal, 100', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 2, name: 'Mecânica do Beto', address: 'Rua das Flores, 45', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 3, name: 'Flash Moto Service', address: 'Rua Veloz, 88', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 4, name: 'Centro Automotivo Silva', address: 'Av. Getúlio Vargas, 1200', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 5, name: 'Oficina Estrela', address: 'Rua Saturno, 33', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 6, name: 'Precision Mechanics', address: 'Industrial Park, Loja 4', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 7, name: 'Moto Master GCL', address: 'Rua das Motos, 10', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 8, name: 'Oficina do Povo', address: 'Bairro Operário, S/N', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 9, name: 'Elite Auto Repair', address: 'Shopping Center, P1', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 10, name: 'Mecânica Rápida', address: 'Posto BR Central', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }

  // 4. Modelos de Veículos (Vehicle Models)
  const modelsCount = db.select({ n: sql<number>`count(*)` }).from(vehicleModels).get();
  if ((modelsCount?.n ?? 0) < 5) {
    db.insert(vehicleModels).values([
      { id: 1, name: 'CG 160 Titan', brand: 'Honda', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 2, name: 'NMAX 160', brand: 'Yamaha', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 3, name: 'Bros 160', brand: 'Honda', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 4, name: 'PCX 150', brand: 'Honda', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 5, name: 'FZ25 Fazer', brand: 'Yamaha', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 6, name: 'XRE 300', brand: 'Honda', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 7, name: 'Lander 250', brand: 'Yamaha', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 8, name: 'Factor 150', brand: 'Yamaha', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 9, name: 'Biz 125', brand: 'Honda', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
      { id: 10, name: 'Pop 110i', brand: 'Honda', status: 'ACTIVE', created_at: now, updated_at: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }

  // 5. Clientes (Customers)
  const customersCount = db.select({ n: sql<number>`count(*)` }).from(customers).get();
  if ((customersCount?.n ?? 0) < 5) {
    db.insert(customers).values([
      { id: 1, user_id: 1, name: 'João Silva', phone: '(11) 98888-7777', cpf: '123.456.789-00', active_contract: 1, balance_due: 0, created_at: now, updated_at: now, dirty: 1 },
      { id: 2, user_id: 1, name: 'Maria Oliveira', phone: '(11) 97777-6666', cpf: '234.567.890-11', active_contract: 1, balance_due: 0, created_at: now, updated_at: now, dirty: 1 },
      { id: 3, user_id: 1, name: 'Pedro Santos', phone: '(21) 96666-5555', cpf: '345.678.901-22', active_contract: 0, balance_due: 150, created_at: now, updated_at: now, dirty: 1 },
      { id: 4, user_id: 1, name: 'Ana Souza', phone: '(31) 95555-4444', cpf: '456.789.012-33', active_contract: 1, balance_due: 0, created_at: now, updated_at: now, dirty: 1 },
      { id: 5, user_id: 1, name: 'Carlos Lima', phone: '(41) 94444-3333', cpf: '567.890.123-44', active_contract: 0, balance_due: 0, created_at: now, updated_at: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }

  // 6. Veículos (Vehicles)
  const vCount = db.select({ n: sql<number>`count(*)` }).from(vehicles).get();
  if ((vCount?.n ?? 0) < 5) {
    db.insert(vehicles).values([
      { id: 1, plate: 'ABC-1234', model_id: 1, year: 2023, status_id: 1, mileage: 5000, default_monthly_rate: 550, created_at: now, updated_at: now, dirty: 1 },
      { id: 2, plate: 'DEF-5678', model_id: 2, year: 2024, status_id: 2, mileage: 1200, current_renter_id: 1, default_monthly_rate: 750, created_at: now, updated_at: now, dirty: 1 },
      { id: 3, plate: 'GHI-9012', model_id: 3, year: 2022, status_id: 1, mileage: 15000, default_monthly_rate: 600, created_at: now, updated_at: now, dirty: 1 },
      { id: 4, plate: 'JKL-3456', model_id: 1, year: 2023, status_id: 3, mileage: 8000, default_monthly_rate: 550, created_at: now, updated_at: now, dirty: 1 },
      { id: 5, plate: 'MNO-7890', model_id: 4, year: 2024, status_id: 2, mileage: 500, current_renter_id: 2, default_monthly_rate: 800, created_at: now, updated_at: now, dirty: 1 },
    ]).onConflictDoNothing().run();
  }
}
