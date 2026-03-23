#!/usr/bin/env node
/**
 * Force Fresh Migration no Supabase:
 * 1. Apaga toda a estrutura existente
 * 2. Aplica schema.sql do zero
 *
 * Uso: npm run db:supabase:fresh
 * Requer: SUPABASE_DB_URL no .env
 *
 * ⚠️  ATENÇÃO: Apaga TODOS os dados. Use apenas em desenvolvimento.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error('❌  SUPABASE_DB_URL não definida no .env');
  process.exit(1);
}

const dropSql   = readFileSync(join(__dirname, 'supabase-drop-all.sql'), 'utf-8');
const schemaSql = readFileSync(
  join(__dirname, '..', 'migrations', 'postgres', 'schema.sql'),
  'utf-8'
);

const client = new Client({ connectionString: url });

try {
  await client.connect();
  console.log('🔗 Conectado ao Supabase.');

  console.log('🗑️  [1/2] Apagando estrutura existente...');
  await client.query(dropSql);
  console.log('    ✓ Estrutura removida.');

  console.log('🏗️  [2/2] Aplicando schema.sql...');
  await client.query(schemaSql);
  console.log('    ✓ Schema aplicado.');

  console.log('\n✅ Force fresh concluído com sucesso!');
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
