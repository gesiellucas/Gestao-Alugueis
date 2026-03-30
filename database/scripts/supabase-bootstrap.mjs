#!/usr/bin/env node
/**
 * Bootstrap do Supabase:
 * 1. Cria tabelas se não existirem
 * 2. Cria buckets se não existirem
 * 3. Cria políticas se não existirem
 *
 * Uso: node database/scripts/supabase-bootstrap.mjs
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

const bootstrapSql = readFileSync(join(__dirname, 'supabase-bootstrap.sql'), 'utf-8');

const client = new Client({ connectionString: url });

async function main() {
  console.log('🚀 Iniciando bootstrap do Supabase...');
  
  try {
    await client.connect();
    console.log('🔗 Conectado ao Supabase.');

    console.log('🏗️  Aplicando estrutura (idempotente)...');
    await client.query(bootstrapSql);
    console.log('    ✓ Estrutura verificada/criada.');

    console.log('\n✅ Bootstrap concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no bootstrap:', err.message);
    // Em caso de erro em transação, o log ajuda a debugar
    if (err.detail) console.error('   Detalhe:', err.detail);
    if (err.hint) console.error('   Dica:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
