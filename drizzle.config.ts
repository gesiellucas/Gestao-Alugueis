import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations/sqlite',
  dialect: 'sqlite',
} satisfies Config;
