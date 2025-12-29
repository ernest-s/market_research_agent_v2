import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getSessionExpiry } from "@/lib/session";

type IdTokenPayload = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    /**
     * 1️⃣ Auth0 identity
     */
    const idToken = req.cookies.get("auth0_id_token")?.value;
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.decode(idToken) as IdTokenPayload | null;
    if (!decoded?.sub || !decoded?.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { sub, email, email_verified } = decoded;

    /**
     * 2️⃣ Provision user (unchanged)
     */
    let user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
    });

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { auth0Sub: sub },
        });
      } else {
        user = await prisma.user.create({
          data: { auth0Sub: sub, email },
        });
      }
    }

    /**
     * 3️⃣ Email verification (unchanged)
     */
    const enforceVerification =
      process.env.NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION === "true";

    if (enforceVerification && email_verified !== true) {
      return NextResponse.json(
        { error: "Email not verified", user },
        { status: 403 }
      );
    }

    /**
     * 4️⃣ Read current app session cookie
     */
    const currentSessionId =
      req.cookies.get("app_session_id")?.value ?? null;

    /**
     * 5️⃣ Find active session
     */
    const activeSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    /**
     * 6️⃣ Conflict only if session belongs to ANOTHER browser
     */
    if (
      activeSession &&
      (!currentSessionId || activeSession.id !== currentSessionId)
    ) {
      return NextResponse.json(
        {
          error: "SESSION_EXISTS",
          activeSession: {
            createdAt: activeSession.createdAt,
            lastSeenAt: activeSession.lastSeenAt,
            userAgent: activeSession.userAgent,
            ipAddress: activeSession.ipAddress,
          },
        },
        { status: 409 }
      );
    }

    /**
     * 7️⃣ Create session ONLY if none exists
     */
    let session = activeSession;

    if (!session) {
      session = await prisma.session.create({
        data: {
          userId: user.id,
          expiresAt: getSessionExpiry(),
          userAgent: req.headers.get("user-agent") ?? undefined,
          ipAddress:
            req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
        },
      });
    }

    /**
     * 8️⃣ Refresh cookie
     */
    const res = NextResponse.json({ user });

    res.cookies.set("app_session_id", session.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("Bootstrap error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
