// src/app/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    /**
     * 1️⃣ Revoke app session (if exists)
     */
    const sessionId = req.cookies.get("app_session_id")?.value;

    if (sessionId) {
      await prisma.session.updateMany({
        where: {
          id: sessionId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "LOGOUT",
        },
      });
    }

    /**
     * 2️⃣ Build Auth0 logout URL
     */
    const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL!;
    const clientId = process.env.AUTH0_CLIENT_ID!;
    const returnTo =
      process.env.AUTH0_BASE_URL || "http://localhost:3000/login";

    const logoutUrl =
      `${issuerBaseUrl}/v2/logout` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&returnTo=${encodeURIComponent(returnTo)}`;

    /**
     * 3️⃣ Redirect to Auth0 logout
     */
    const res = NextResponse.redirect(logoutUrl);

    // 🔒 Prevent caching
    res.headers.set("Cache-Control", "no-store");

    // 🧹 Clear app session cookie
    res.cookies.set("app_session_id", "", {
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.redirect("/login");
  }
}
