import path from 'path';
import os from 'os';
import fs, { existsSync } from 'fs';
import { createClient } from '@libsql/client';

const DEVICE_ID = 'seed-device';

const DB_DIR =
  process.env.DB_DIR ??
  path.join(
    process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'),
    'Electron'
  );

const DB_PATH = path.join(DB_DIR, 'gc-loca-moto.sqlite');

// Ordem de deleção respeita as dependências de FK (filhos antes dos pais)
const TABLES_IN_ORDER = [
  'documents',
  'contracts',
  'maintenance_records',
  'rentals',
  'app_users',
  'vehicles',
  'customers',
  'vehicle_models',
  'vehicle_statuses',
  'roles',
  'workshops',
] as const;

async function main() {
  console.log('\n🗑️   GC Locamoto — Limpar dados de seed');
  console.log(`    DB:        ${DB_PATH}`);
  console.log(`    device_id: ${DEVICE_ID}\n`);

  if (!existsSync(DB_PATH)) {
    console.log('⚠️   Banco de dados não encontrado. Nada a limpar.\n');
    process.exit(0);
  }

  const client = createClient({ url: `file:${DB_PATH.replace(/\\/g, '/')}` });

  // Desabilita FKs temporariamente para permitir deleção sem ordem estrita
  await client.execute('PRAGMA foreign_keys = OFF');

  let total = 0;

  for (const table of TABLES_IN_ORDER) {
    const result = await client.execute({
      sql: `DELETE FROM ${table} WHERE device_id = ?`,
      args: [DEVICE_ID],
    });
    
    if (result.rowsAffected > 0) {
      console.log(`✓  ${table.padEnd(22)} ${result.rowsAffected} registros removidos`);
    }
    total += result.rowsAffected;
  }

  await client.execute('PRAGMA foreign_keys = ON');

  if (total === 0) {
    console.log('ℹ️   Nenhum registro seed encontrado.');
  } else {
    console.log(`\n✅  Limpeza concluída — ${total} registros removidos\n`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Erro durante a limpeza:', err);
  process.exit(1);
});
