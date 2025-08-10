import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazy-create a Supabase client.
 * - Returns null during Vercel build if envs aren't present (prevents crashes).
 * - In the browser, throws if envs are missing so we notice fast.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window === 'undefined') return null; // build-time safety
    throw new Error('Missing Supabase env vars');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
