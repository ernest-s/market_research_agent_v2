// src/app/auth/logout/route.ts
import { NextResponse } from "next/server";

export function GET() {
  const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL!;
  const clientId = process.env.AUTH0_CLIENT_ID!;
  const returnTo = process.env.AUTH0_BASE_URL!;

  const logoutUrl =
    `${issuerBaseUrl}/v2/logout` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&returnTo=${encodeURIComponent(returnTo)}`;

  const res = NextResponse.redirect(logoutUrl);

  // 🔒 Prevent caching
  res.headers.set("Cache-Control", "no-store");

  // 🧹 Clear app-level cookies (if any)
  res.cookies.delete("auth0_id_token");
  res.cookies.delete("auth0_session");

  return res;
}
