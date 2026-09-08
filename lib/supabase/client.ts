import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

let browserClient: SupabaseClient | undefined;

export const createClient = () => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (typeof window === 'undefined') {
    return createBrowserClient(url, key);
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }

  return browserClient;
};
