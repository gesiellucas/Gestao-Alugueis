import 'dotenv/config';
import type { Config } from 'drizzle-kit';

// Para usar db:push:supabase, configure no .env:
//   SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
// O URL do banco direto (porta 5432) é diferente da URL da API (porta 443).
// Encontre em: Supabase Dashboard → Settings → Database → Connection string → URI

export default {
  schema: './schema/postgres.ts',
  out: './migrations/postgres/migrations',
  dialect: 'postgresql',
  ...(process.env.SUPABASE_DB_URL
    ? { dbCredentials: { url: process.env.SUPABASE_DB_URL } }
    : {}),
} satisfies Config;
