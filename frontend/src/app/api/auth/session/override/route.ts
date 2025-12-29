import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getSessionExpiry, revokeUserSessions } from "@/lib/session";

type IdTokenPayload = {
  sub?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    /**
     * 1️⃣ Read Auth0 ID token
     */
    const idToken = req.cookies.get("auth0_id_token")?.value;

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /**
     * 2️⃣ Decode token
     */
    const decoded = jwt.decode(idToken) as IdTokenPayload | null;

    if (!decoded?.sub || !decoded?.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const { sub, email } = decoded;

    /**
     * 3️⃣ Resolve user (same logic as bootstrap)
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
        // This should not normally happen, but keep it safe
        user = await prisma.user.create({
          data: {
            auth0Sub: sub,
            email,
          },
        });
      }
    }

    /**
     * 4️⃣ Revoke ALL existing sessions for this user
     */
    await revokeUserSessions(user.id, "OVERRIDDEN");

    /**
     * 5️⃣ Create new session
     */
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt: getSessionExpiry(),
        userAgent: req.headers.get("user-agent") ?? undefined,
        ipAddress:
          req.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
      },
    });

    /**
     * 6️⃣ Set new app session cookie
     */
    const res = NextResponse.json({ success: true });

    res.cookies.set("app_session_id", session.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("Session override error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
