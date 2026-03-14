import 'dotenv/config';
import path from 'path';
import os from 'os';
import type { Config } from 'drizzle-kit';

// Para diferenciar entre SQLite (local) e PostgreSQL (Supabase/Sync)
const isPg = process.env.DRIZZLE_TARGET === 'pg';

const defaultDbPath = path.join(
  os.homedir(),
  'AppData', 'Roaming', 'Electron', 'gc-loca-moto.sqlite'
);

export default {
  schema: isPg ? './database/schema/postgres.ts' : './database/schema/sqlite.ts',
  out: isPg ? './database/migrations/postgres' : './database/migrations/sqlite',
  dialect: isPg ? 'postgresql' : 'sqlite',
  dbCredentials: {
    url: isPg ? (process.env.SUPABASE_DB_URL ?? '') : `file:${process.env.SQLITE_DB_PATH ?? defaultDbPath}`,
  },
} satisfies Config;
