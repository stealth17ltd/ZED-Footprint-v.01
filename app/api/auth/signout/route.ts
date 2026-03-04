import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  await supabase.auth.signOut();
  
  // Get the origin from request headers to support network access
  const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || new URL(request.url).origin;
  
  return NextResponse.redirect(new URL('/login', origin));
}
