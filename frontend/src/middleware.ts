import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth is enforced at:
 * - Page level (useUser)
 * - API level (getSession)
 *
 * Middleware is intentionally auth-agnostic.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/api/:path*",
  ],
};
