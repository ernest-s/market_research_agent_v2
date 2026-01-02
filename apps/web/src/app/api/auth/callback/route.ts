import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getSessionExpiry } from "@/lib/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const error = searchParams.get("error");
  const code = searchParams.get("code");

  if (error === "access_denied") {
    const logoutUrl =
      `${process.env.AUTH0_ISSUER_BASE_URL}/v2/logout` +
      `?client_id=${encodeURIComponent(process.env.AUTH0_CLIENT_ID!)}` +
      `&returnTo=${encodeURIComponent(
        `${process.env.AUTH0_BASE_URL}/login`
      )}`;

    return NextResponse.redirect(logoutUrl);
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.AUTH0_BASE_URL}/login`
    );
  }

  // Exchange code for tokens
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

  const decoded = jwt.decode(idToken) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  } | null;

  if (!decoded?.sub) {
    return NextResponse.redirect(
      `${process.env.AUTH0_BASE_URL}/login`
    );
  }

  // 1️⃣ Find or create user
  const user = await prisma.user.upsert({
    where: { auth0Sub: decoded.sub },
    update: {},
    create: {
      auth0Sub: decoded.sub,
      email: decoded.email!,
      status: "ACTIVE",
    },
  });

  // 2️⃣ ALWAYS create a NEW app session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      lastSeenAt: new Date(),
      expiresAt: getSessionExpiry(),
    },
  });

  const redirectPath = decoded.email_verified
    ? "/dashboard"
    : "/verify-email";

  const res = NextResponse.redirect(
    `${process.env.AUTH0_BASE_URL}${redirectPath}`
  );

  // 3️⃣ Set BOTH cookies
  res.cookies.set("auth0_id_token", idToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  res.cookies.set("app_session_id", session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
