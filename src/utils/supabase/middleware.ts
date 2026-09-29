import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const updateSession = async (request: NextRequest) => {
  // Pass through RSC payload, component streaming, and router prefetch requests directly
  // to avoid mutating or dropping Next.js internal RSC streaming headers
  if (
    request.headers.get('rsc') === '1' ||
    request.headers.get('accept')?.includes('text/x-component') ||
    request.headers.has('next-router-prefetch') ||
    request.headers.has('next-router-state-tree') ||
    request.nextUrl.searchParams.has('_rsc') ||
    request.nextUrl.pathname.startsWith('/media') ||
    request.nextUrl.pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      },
    );

    // Refresh session if needed
    await supabase.auth.getUser();
  } catch (error) {
    // Prevent unhandled errors from breaking navigation
  }

  return supabaseResponse;
};

// Backwards compatibility if any file still imports createClient
export const createClient = updateSession;
