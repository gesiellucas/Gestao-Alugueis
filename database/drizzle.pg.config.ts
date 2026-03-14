import 'dotenv/config';
import type { Config } from 'drizzle-kit';

/**
 * Configuração Drizzle para PostgreSQL (Supabase).
 * Para usar: npx drizzle-kit push --config=drizzle.pg.config.ts
 */
export default {
  schema: './database/schema/postgres.ts',
  out: './database/migrations/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL ?? '',
  },
} satisfies Config;
