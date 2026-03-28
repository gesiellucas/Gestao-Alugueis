import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: './database/schema/postgres.ts',
  out: './database/migrations/postgres',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL ?? '',
  },
} satisfies Config;
