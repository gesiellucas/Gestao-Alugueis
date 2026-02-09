import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabasePublishableKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY e VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY são obrigatórias. ' +
    'Adicione-as ao arquivo .env'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  }
});
