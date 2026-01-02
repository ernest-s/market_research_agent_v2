import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const error = searchParams.get("error");
  const code = searchParams.get("code");

  /**
   * 🔴 User clicked "Decline"
   * OAuth spec: access_denied means authorization was refused,
   * NOT that the user was logged out.
   * We explicitly force a global logout to avoid consent loops.
   */
  if (error === "access_denied") {
    const logoutUrl =
      `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout` +
      `?client_id=${encodeURIComponent(process.env.AUTH0_CLIENT_ID!)}` +
      `&returnTo=${encodeURIComponent(
        `${process.env.AUTH0_BASE_URL}/login`
      )}`;

    return NextResponse.redirect(logoutUrl);
  }

  /**
   * No authorization code → go back to login
   */
  if (!code) {
    return NextResponse.redirect(
      `${process.env.AUTH0_BASE_URL}/login`
    );
  }

  /**
   * Exchange authorization code for tokens
   */
  const tokenRes = await fetch(
    `${process.env.AUTH0_ISSUER_BASE_URL}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
      }),
    }
  );

  if (!tokenRes.ok) {
    console.error("Token exchange failed");
    return NextResponse.redirect(
      `${process.env.AUTH0_BASE_URL}/login`
    );
  }

  const tokenData = await tokenRes.json();
  const idToken = tokenData.id_token;

  /**
   * Decode ID token (verification not required here;
   * trust boundary is Auth0 → backend APIs enforce auth)
   */
  const decoded = jwt.decode(idToken) as {
    email_verified?: boolean;
  } | null;

  const isVerified = decoded?.email_verified === true;

  const redirectPath = isVerified
    ? "/dashboard"
    : "/verify-email";

  const res = NextResponse.redirect(
    `${process.env.AUTH0_BASE_URL}${redirectPath}`
  );

  /**
   * Store ID token for backend APIs
   */
  res.cookies.set("auth0_id_token", idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res;
}
