import 'dotenv/config';
import path from 'path';
import os from 'os';
import type { Config } from 'drizzle-kit';

// Caminho padrão do banco SQLite em desenvolvimento (mesmo local que o Electron usa)
// Pode ser sobrescrito com a variável SQLITE_DB_PATH no .env
const defaultDbPath = path.join(
  os.homedir(),
  'AppData', 'Roaming', 'Electron', 'gc-loca-moto.sqlite'
);

export default {
  schema: './db/schema.ts',
  out: './db/migrations/sqlite',
  dialect: 'sqlite',
  dbCredentials: {
    url: `file:${process.env.SQLITE_DB_PATH ?? defaultDbPath}`,
  },
} satisfies Config;
