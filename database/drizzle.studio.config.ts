import 'dotenv/config';
import path from 'path';
import os from 'os';
import type { Config } from 'drizzle-kit';

// Usa @libsql/client (pure JS/WASM) para evitar conflito de ABI com better-sqlite3
// que é compilado para o Electron. Este config é exclusivo para `drizzle-kit studio`.

const defaultDbPath = path.join(
  os.homedir(),
  'AppData', 'Roaming', 'Electron', 'gc-loca-moto.sqlite'
);

const dbPath = process.env.SQLITE_DB_PATH ?? defaultDbPath;

export default {
  schema: './schema/sqlite.ts',
  dialect: 'turso',
  dbCredentials: {
    url: `file:${dbPath}`,
  },
} satisfies Config;
