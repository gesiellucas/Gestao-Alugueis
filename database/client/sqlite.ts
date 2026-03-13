import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '../schema/sqlite';

export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;
let _sqlite: Database.Database | null = null;

/**
 * Inicializa o banco SQLite com Drizzle ORM e aplica migrações pendentes.
 * Deve ser chamado uma vez na inicialização do processo Electron (main).
 *
 * @param dbPath - Caminho absoluto para o arquivo .sqlite
 * @param migrationsFolder - Caminho absoluto para a pasta de migrações geradas pelo drizzle-kit
 */
export function initDb(dbPath: string, migrationsFolder: string): DrizzleDb {
  _sqlite = new Database(dbPath);
  _sqlite.pragma('journal_mode = WAL');

  _db = drizzle(_sqlite, { schema });
  migrate(_db, { migrationsFolder });

  _sqlite.pragma('foreign_keys = ON');

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
 * Retorna a instância raw do better-sqlite3.
 * Usada pelo sync engine para queries dinâmicas (PRAGMA, upsert genérico).
 */
export function getRawDb(): Database.Database {
  if (!_sqlite) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return _sqlite;
}

export * from '../schema/sqlite';
