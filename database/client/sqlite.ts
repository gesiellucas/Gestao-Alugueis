import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import * as schema from '../schema/sqlite';

export type DrizzleDb = LibSQLDatabase<typeof schema>;

let _db: DrizzleDb | null = null;
let _client: Client | null = null;

/**
 * Inicializa o banco SQLite com Drizzle ORM e aplica migrações pendentes.
 * Deve ser chamado uma vez na inicialização do processo Electron (main).
 *
 * @param dbPath - Caminho absoluto para o arquivo .sqlite
 * @param migrationsFolder - Caminho absoluto para a pasta de migrações geradas pelo drizzle-kit
 */
export async function initDb(dbPath: string, migrationsFolder: string): Promise<DrizzleDb> {
  // Converte o caminho para formato URL compatível com libsql em Windows
  const url = `file:${dbPath.replace(/\\/g, '/')}`;
  
  _client = createClient({ url });

  // Aplica PRAGMAs através da execução direta
  await _client.execute('PRAGMA journal_mode = WAL');
  await _client.execute('PRAGMA foreign_keys = ON');

  _db = drizzle(_client, { schema });
  
  await migrate(_db, { migrationsFolder });

  return _db;
}

/**
 * Retorna a instância Drizzle já inicializada.
 * Lança erro se chamado antes de initDb().
 */
export function getDb(): DrizzleDb {
  if (!_db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _db;
}

/**
 * Retorna a instância Client (libsql).
 * Usada pelo sync engine para queries dinâmicas.
 */
export function getRawDb(): Client {
  if (!_client) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _client;
}

export * from '../schema/sqlite';
