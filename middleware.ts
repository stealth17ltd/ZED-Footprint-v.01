import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/auth/callback'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasSupabaseAuthCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some(
    (cookie) => cookie.name.includes('-auth-token') && !cookie.name.includes('code-verifier'),
  );
}

/** Edge fetch that never throws — failed network becomes 503 so Auth can settle. */
const edgeFetch: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init);
  } catch {
    return new Response(JSON.stringify({ error: 'auth_unreachable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const publicRoute = isPublicPath(pathname);

  // No session cookie: skip Auth entirely. Visiting /login must not call Supabase
  // (stale cookies are the usual cause of "fetch failed" spam in Edge middleware).
  if (!hasSupabaseAuthCookie(req)) {
    if (publicRoute) {
      return NextResponse.next({ request: req });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  let supabaseResponse = NextResponse.next({ request: req });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
      global: { fetch: edgeFetch },
      auth: {
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  if (!user && !publicRoute) {
    const loginUrl = new URL('/login', req.url);
    const response = NextResponse.redirect(loginUrl);
    // Drop unusable session cookies so the next /login request does not retry Auth.
    req.cookies.getAll()
      .filter((c) => c.name.includes('-auth-token'))
      .forEach((c) => response.cookies.delete(c.name));
    return response;
  }

  if (user && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
