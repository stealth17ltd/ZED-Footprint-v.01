/**
 * Public Supabase env for browser and server clients.
 * Placeholder values keep `next build` from crashing when Vercel prerenders
 * pages before runtime env is available. Real values are required at runtime.
 */
const BUILD_PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const BUILD_PLACEHOLDER_ANON_KEY = 'public-anon-key';

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || BUILD_PLACEHOLDER_URL;
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || BUILD_PLACEHOLDER_ANON_KEY;
}
