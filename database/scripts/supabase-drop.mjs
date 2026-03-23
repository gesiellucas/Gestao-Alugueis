#!/usr/bin/env node
/**
 * Apaga toda a estrutura do banco Supabase remoto.
 * Uso: npm run db:supabase:drop
 * Requer: SUPABASE_DB_URL no .env
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

const sql = readFileSync(join(__dirname, 'supabase-drop-all.sql'), 'utf-8');

const client = new Client({ connectionString: url });

try {
  await client.connect();
  console.log('🔗 Conectado ao Supabase.');
  console.log('🗑️  Apagando toda a estrutura...');
  await client.query(sql);
  console.log('✅ Estrutura removida com sucesso.');
} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
