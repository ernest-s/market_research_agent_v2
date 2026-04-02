import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/verifyIdToken";
import { revokeUserSessions } from "@/lib/session";
import { setAuth0UserBlocked } from "@/lib/auth0Management";

export async function GET(req: NextRequest) {
  try {
    /**
     * 1️⃣ Read Auth0 ID token
     */
    const idToken = req.cookies.get("auth0_id_token")?.value;
    if (!idToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    let decoded;
    try {
      decoded = await verifyIdToken(idToken);
    } catch {
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
      return NextResponse.redirect(
        new URL("/session-conflict", req.url)
      );
    }

    /**
     * 4️⃣ Block user in Auth0
     *
     * Prevents login with old password until the reset is completed.
     */
    try {
      await setAuth0UserBlocked(decoded.sub, true);
    } catch (err) {
      console.error("Failed to block Auth0 user:", err);
      return NextResponse.redirect(
        new URL("/profile?passwordError=1", req.url)
      );
    }

    /**
     * 5️⃣ Trigger Auth0 password reset email
     *
     * If this fails, unblock the user to restore their access.
     */
    const resetRes = await fetch(
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

    if (!resetRes.ok) {
      console.error("Auth0 change password error:", await resetRes.text());
      try {
        await setAuth0UserBlocked(decoded.sub, false);
      } catch (unblockErr) {
        console.error("Failed to unblock Auth0 user after email failure:", unblockErr);
      }
      return NextResponse.redirect(
        new URL("/profile?passwordError=1", req.url)
      );
    }

    /**
     * 6️⃣ Revoke all active sessions — force sign-out across all devices
     */
    await revokeUserSessions(user.id, "LOGOUT");

    /**
     * 7️⃣ Clear cookies and redirect to confirmation page
     */
    const res = NextResponse.redirect(
      new URL("/password-reset-sent", req.url)
    );

    res.cookies.set("app_session_id", "", { path: "/", maxAge: 0 });
    res.cookies.set("auth0_id_token", "", { path: "/", maxAge: 0 });

    return res;
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.redirect(
      new URL("/profile?passwordError=1", req.url)
    );
  }
}
