import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type IdTokenPayload = {
  sub?: string;
  email?: string;
};

export async function GET(req: NextRequest) {
  try {
    /**
     * 1️⃣ Read Auth0 ID token
     */
    const idToken = req.cookies.get("auth0_id_token")?.value;
    if (!idToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const decoded = jwt.decode(idToken) as IdTokenPayload | null;
    if (!decoded?.sub || !decoded.email) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    /**
     * 2️⃣ Resolve user
     */
    const user = await prisma.user.findUnique({
      where: { auth0Sub: decoded.sub },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    /**
     * 🚫 3️⃣ HARD BLOCK during session conflict
     *
     * If there is MORE THAN ONE active session → deny
     */
    const activeSessions = await prisma.session.count({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeSessions > 1) {
      // Redirect to conflict resolution
      return NextResponse.redirect(
        new URL("/session-conflict", req.url)
      );
    }

    /**
     * 4️⃣ Trigger Auth0 password reset email
     */
    const res = await fetch(
      `https://${process.env.AUTH0_ISSUER_BASE_URL!.replace(
        "https://",
        ""
      )}/dbconnections/change_password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          email: decoded.email,
          connection: "Username-Password-Authentication",
        }),
      }
    );

    if (!res.ok) {
      console.error("Auth0 change password error:", await res.text());
      return NextResponse.redirect(
        new URL("/profile?passwordError=1", req.url)
      );
    }

    return NextResponse.redirect(
      new URL("/profile?passwordSent=1", req.url)
    );
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.redirect(
      new URL("/profile?passwordError=1", req.url)
    );
  }
}
