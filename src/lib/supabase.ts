import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window === 'undefined') return null; // ignore at build
    throw new Error('Missing Supabase env vars');
  }

  client = createClient(url, key, {
    auth: {
      persistSession: true,        // ✅ keep the session after redirect
      autoRefreshToken: true,
      detectSessionInUrl: true,    // ✅ parse magic-link tokens from URL
    },
  });

  return client;
}
