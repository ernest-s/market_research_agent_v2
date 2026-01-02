import { NextRequest, NextResponse } from "next/server";

/**
 * Global middleware (EDGE SAFE)
 *
 * Responsibilities:
 * - Protect authenticated UI pages
 * - Allow first-time bootstrap after Auth0 login
 * - NEVER touch the database
 * - NEVER validate sessions (APIs do that)
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /**
   * 🔒 Only protect UI pages
   */
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile");

  if (!isProtectedPage) {
    return NextResponse.next();
  }

  /**
   * 🍪 Read cookies (edge-safe)
   */
  const appSessionId = req.cookies.get("app_session_id")?.value;
  const auth0IdToken = req.cookies.get("auth0_id_token")?.value;

  /**
   * 🟢 First login after Auth0
   * Allow page to load so bootstrap can run
   */
  if (!appSessionId && auth0IdToken) {
    return NextResponse.next();
  }

  /**
   * ❌ No session and no identity
   */
  if (!appSessionId) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  /**
   * ✅ Session cookie exists
   * Actual validation happens in APIs
   */
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
  ],
};
