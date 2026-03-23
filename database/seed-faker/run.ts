import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../schema/sqlite';
import fs from 'fs';
import {
  workshops,
  vehicleStatuses,
  vehicleModels,
  roles,
  vehicles,
  customers,
  appUsers,
  rentals,
  contracts,
  maintenanceRecords,
} from '../schema/sqlite';

// ─── Constantes ──────────────────────────────────────────────────────────────

const DEVICE_ID = 'seed-device';
const SEED_USER_ID = 'seed-user-01';

// ─── Quantidades ─────────────────────────────────────────────────────────────

const QTY = {
  workshops:          5,
  appUsers:           10,
  customers:          200,
  vehicles:           100,
  rentals:            150,
  rentalsActive:      60,   // subset de rentals com status ACTIVE (restante = ENDED)
  contracts:          120,  // subset de rentals que têm contrato (≤ rentals)
  maintenanceRecords: 80,
} as const;

const DB_DIR =
  process.env.DB_DIR ??
  path.join(
    process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
    'Electron'
  );

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'gc-loca-moto.sqlite');

const MIGRATIONS_FOLDER = path.resolve('database/migrations/sqlite');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Metadados de sync comuns a todas as tabelas */
function syncMeta() {
  const createdAt = faker.date
    .between({ from: '2024-01-01', to: '2026-02-28' })
    .toISOString();
  return {
    device_id: DEVICE_ID,
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    updated_by: null,
    version: 1,
    is_deleted: 0,
    sync_status: 'pending' as const,
  };
}

/** Formata CPF no padrão NNN.NNN.NNN-NN (não validado, apenas para exibição) */
function fakeCpf(): string {
  const d = Array.from({ length: 9 }, () => faker.number.int({ min: 0, max: 9 }));
  const c1 = faker.number.int({ min: 0, max: 9 });
  const c2 = faker.number.int({ min: 0, max: 9 });
  return `${d[0]}${d[1]}${d[2]}.${d[3]}${d[4]}${d[5]}.${d[6]}${d[7]}${d[8]}-${c1}${c2}`;
}

/** Gera placa no formato ABC-1234, garantindo unicidade */
const usedPlates = new Set<string>();
function fakePlate(): string {
  let plate: string;
  do {
    const letters = faker.string.alpha({ length: 3, casing: 'upper' });
    const numbers = faker.number.int({ min: 1000, max: 9999 });
    plate = `${letters}-${numbers}`;
  } while (usedPlates.has(plate));
  usedPlates.add(plate);
  return plate;
}

/** Formata uma data como YYYY-MM-DD */
function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ─── Dados estáticos ──────────────────────────────────────────────────────────

const MOTO_BRANDS = [
  { brand: 'Honda',    models: ['CG 160', 'Biz 125', 'Pop 110i', 'PCX 150', 'CB 300R'] },
  { brand: 'Yamaha',   models: ['Factor 150', 'Fazer 250', 'YBR 150', 'NMAX 160', 'Crosser 150'] },
  { brand: 'Suzuki',   models: ['GSR 150i', 'Burgman 125', 'DR 650', 'Intruder 125'] },
  { brand: 'Kawasaki', models: ['Z300', 'Ninja 300', 'Versys 300', 'Z400'] },
];

const STATUS_LIST = [
  { name: 'Disponível',    color: '#22c55e', is_default: 1 },
  { name: 'Alugada',       color: '#3b82f6', is_default: 0 },
  { name: 'Em Manutenção', color: '#f59e0b', is_default: 0 },
  { name: 'Reservada',     color: '#8b5cf6', is_default: 0 },
  { name: 'Indisponível',  color: '#ef4444', is_default: 0 },
  { name: 'Roubada',       color: '#7c3aed', is_default: 0 },
  { name: 'PT',            color: '#1e293b', is_default: 0 },
];

const MAINTENANCE_TYPES = [
  'Troca de Óleo',
  'Revisão Preventiva',
  'Troca de Pneu',
  'Freios',
  'Suspensão',
  'Sistema Elétrico',
  'Correia/Corrente',
  'Carburador/Injeção',
];

const MECHANIC_NAMES = [
  'Carlos Augusto', 'Marcos Silva', 'José Ferreira', 'Roberto Costa',
  'Paulo Henrique', 'Anderson Lima', 'Fábio Sousa', 'Leandro Nunes',
];

const MONTHLY_RATES = [450, 500, 550, 600, 650, 700, 750, 800];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱  GC Locamoto — Seed Faker');
  console.log(`    DB:        ${DB_PATH}`);
  console.log(`    device_id: ${DEVICE_ID}`);
  console.log(`    user_id:   ${SEED_USER_ID}\n`);

  const client = createClient({ url: `file:${DB_PATH.replace(/\\/g, '/')}` });
  const db = drizzle(client, { schema });

  // Aplica migrações
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  // ── 1. Workshops ────────────────────────────────────────────────────────────
  const workshopIds = Array.from({ length: QTY.workshops }, () => randomUUID());
  await db.insert(workshops).values(
    workshopIds.map((id) => ({
      id,
      name: `Oficina ${faker.company.name()}`,
      address: `${faker.location.streetAddress()}, ${faker.location.city()} - ${faker.location.state({ abbreviated: true })}`,
      status: faker.helpers.weightedArrayElement([
        { weight: 4, value: 'ACTIVE' },
        { weight: 1, value: 'INACTIVE' },
      ]) as 'ACTIVE' | 'INACTIVE',
      ...syncMeta(),
    }))
  );
  console.log(`✓  workshops            ${QTY.workshops}`);

  // ── 2. Vehicle Statuses (5) ─────────────────────────────────────────────────
  const vehicleStatusIds = STATUS_LIST.map(() => randomUUID());
  await db.insert(vehicleStatuses).values(
    STATUS_LIST.map((s, i) => ({
      id: vehicleStatusIds[i],
      name: s.name,
      color: s.color,
      is_default: s.is_default,
      ...syncMeta(),
    }))
  );
  console.log(`✓  vehicle_statuses     7`);

  // ── 3. Vehicle Models (18) ──────────────────────────────────────────────────
  const vehicleModelIds: string[] = [];
  const vehicleModelRows = MOTO_BRANDS.flatMap(({ brand, models }) =>
    models.map((name) => {
      const id = randomUUID();
      vehicleModelIds.push(id);
      return { id, name, brand, image_url: null, status: 'ACTIVE' as const, ...syncMeta() };
    })
  );
  await db.insert(vehicleModels).values(vehicleModelRows);
  console.log(`✓  vehicle_models       ${vehicleModelRows.length}`);

  // ── 4. Roles (3) ────────────────────────────────────────────────────────────
  const roleIds = Array.from({ length: 3 }, () => randomUUID());
  await db.insert(roles).values([
    {
      id: roleIds[0],
      name: 'Administrador',
      permissions: JSON.stringify(['*']),
      workshop_id: null,
      ...syncMeta(),
    },
    {
      id: roleIds[1],
      name: 'Operador',
      permissions: JSON.stringify([
        'dashboard',
        'clientes_view', 'clientes_edit',
        'financeiro_view', 'financeiro_edit',
        'veiculos_view',
      ]),
      workshop_id: null,
      ...syncMeta(),
    },
    {
      id: roleIds[2],
      name: 'Mecânico',
      permissions: JSON.stringify([
        'veiculos_view',
        'oficina_view', 'oficina_edit',
      ]),
      workshop_id: workshopIds[0],
      ...syncMeta(),
    },
  ]);
  console.log(`✓  roles                3`);

  // ── 5. App Users ────────────────────────────────────────────────────────────
  await db.insert(appUsers).values(
    Array.from({ length: QTY.appUsers }, (_, i) => ({
      id: randomUUID(),
      name: faker.person.fullName(),
      email: `seed.user.${i + 1}@gclocamoto.test`,
      password: '123456',
      role_id: faker.helpers.arrayElement(roleIds),
      ...syncMeta(),
    }))
  );
  console.log(`✓  app_users            ${QTY.appUsers}`);

  // ── 6. Customers ────────────────────────────────────────────────────────────
  const customerIds = Array.from({ length: QTY.customers }, () => randomUUID());
  await db.insert(customers).values(
    customerIds.map((id) => ({
      id,
      user_id: SEED_USER_ID,
      name: faker.person.fullName(),
      phone: faker.phone.number({ style: 'national' }),
      cpf: fakeCpf(),
      active_contract: 0,
      balance_due:
        faker.helpers.maybe(
          () => faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
          { probability: 0.3 },
        ) ?? 0,
      last_payment_date:
        faker.helpers.maybe(
          () => toDateStr(faker.date.between({ from: '2025-01-01', to: '2026-03-01' })),
          { probability: 0.6 },
        ) ?? null,
      ...syncMeta(),
    }))
  );
  console.log(`✓  customers            ${QTY.customers}`);

  // ── 7. Vehicles ─────────────────────────────────────────────────────────────
  const vehicleIds = Array.from({ length: QTY.vehicles }, () => randomUUID());
  const vehicleData = vehicleIds.map((id) => ({
    id,
    plate: fakePlate(),
    model_id: faker.helpers.arrayElement(vehicleModelIds),
    year: faker.number.int({ min: 2018, max: 2025 }),
    status_id: faker.helpers.weightedArrayElement([
      { weight: 4, value: vehicleStatusIds[0] }, // Disponível
      { weight: 4, value: vehicleStatusIds[1] }, // Alugada
      { weight: 2, value: vehicleStatusIds[2] }, // Em Manutenção
    ]),
    mileage: faker.number.int({ min: 0, max: 80_000 }),
    current_renter_id: null,
    default_monthly_rate: faker.helpers.arrayElement(MONTHLY_RATES),
    ...syncMeta(),
  }));
  await db.insert(vehicles).values(vehicleData);
  console.log(`✓  vehicles             ${QTY.vehicles}`);

  // ── 8. Rentals ──────────────────────────────────────────────────────────────
  const rentalIds = Array.from({ length: QTY.rentals }, () => randomUUID());
  const shuffledCustomers = faker.helpers.shuffle([...customerIds]);
  const shuffledVehicles = faker.helpers.shuffle([...vehicleIds]);

  await db.insert(rentals).values(
    rentalIds.map((id, i) => {
      const isActive = i < QTY.rentalsActive;
      const startDate = faker.date.between({ from: '2024-01-01', to: '2026-01-31' });
      return {
        id,
        user_id: SEED_USER_ID,
        vehicle_id: shuffledVehicles[i % vehicleIds.length],
        customer_id: shuffledCustomers[i % customerIds.length],
        start_date: toDateStr(startDate),
        end_date: isActive
          ? null
          : toDateStr(faker.date.between({ from: startDate, to: '2026-03-01' })),
        monthly_rate: faker.helpers.arrayElement(MONTHLY_RATES),
        status: (isActive ? 'ACTIVE' : 'ENDED') as 'ACTIVE' | 'ENDED',
        ...syncMeta(),
      };
    })
  );
  console.log(`✓  rentals              ${QTY.rentals}  (${QTY.rentalsActive} ativas, ${QTY.rentals - QTY.rentalsActive} encerradas)`);

  // ── 9. Contracts ────────────────────────────────────────────────────────────
  await db.insert(contracts).values(
    rentalIds.slice(0, QTY.contracts).map((rental_id) => ({
      id: randomUUID(),
      rental_id,
      ...syncMeta(),
    }))
  );
  console.log(`✓  contracts            ${QTY.contracts}`);

  // ── 10. Maintenance Records ──────────────────────────────────────────────────
  await db.insert(maintenanceRecords).values(
    Array.from({ length: QTY.maintenanceRecords }, () => {
      const idx = faker.number.int({ min: 0, max: vehicleIds.length - 1 });
      const vehicleId = vehicleIds[idx];
      const plate = vehicleData[idx].plate;
      const isCompleted = faker.datatype.boolean({ probability: 0.6 });
      const entryDate = faker.date.between({ from: '2024-01-01', to: '2026-02-01' });
      return {
        id: randomUUID(),
        user_id: SEED_USER_ID,
        vehicle_id: vehicleId,
        workshop_id:
          faker.helpers.maybe(
            () => faker.helpers.arrayElement(workshopIds),
            { probability: 0.7 },
          ) ?? null,
        vehicle_plate: plate,
        entry_date: toDateStr(entryDate),
        completion_date: isCompleted
          ? toDateStr(faker.date.between({ from: entryDate, to: '2026-03-01' }))
          : null,
        mechanic_name: faker.helpers.arrayElement(MECHANIC_NAMES),
        description: faker.lorem.sentence({ min: 5, max: 15 }),
        type: faker.helpers.arrayElement(MAINTENANCE_TYPES),
        cost: faker.number.float({ min: 50, max: 3_000, fractionDigits: 2 }),
        status: (isCompleted ? 'COMPLETED' : 'OPEN') as 'COMPLETED' | 'OPEN',
        ...syncMeta(),
      };
    })
  );
  console.log(`✓  maintenance_records  ${QTY.maintenanceRecords}`);

  // ── Resumo ───────────────────────────────────────────────────────────────────
  const total =
    QTY.workshops + STATUS_LIST.length + vehicleModelRows.length + roleIds.length +
    QTY.appUsers + QTY.customers + QTY.vehicles + QTY.rentals + QTY.contracts + QTY.maintenanceRecords;
  console.log(`\n✅  Seed concluído — ${total} registros inseridos`);
  console.log(`    Para remover: npm run db:seed:clean\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Erro durante o seed:', err);
  process.exit(1);
});
