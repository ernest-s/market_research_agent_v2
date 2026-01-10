import { prisma } from "@/lib/prisma";
import { getSessionExpiry } from "@/lib/session";

/**
 * requireSession
 *
 * Enforces:
 * - session existence
 * - revocation
 * - STRICT inactivity timeout (with correct first-use handling)
 * - user + corporate account ACTIVE status
 *
 * IMPORTANT BEHAVIOR (FIXED):
 * - A session is ALWAYS valid on its first authenticated request.
 * - Inactivity timeout is enforced ONLY after first use.
 */

export type RequireSessionResult =
  | { kind: "VALID"; session: any }
  | { kind: "SUSPENDED" }
  | { kind: "INVALID" };

export async function requireSession(
  sessionId: string | null
): Promise<RequireSessionResult> {
  if (!sessionId) {
    return { kind: "INVALID" };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          corporateAccount: true,
        },
      },
    },
  });

  if (!session) {
    return { kind: "INVALID" };
  }

  /**
   * 1️⃣ Revoked session → immediately reject
   */
  if (session.revokedAt) {
    return { kind: "INVALID" };
  }

  /**
   * 2️⃣ User / corporate status enforcement
   */
  const user = session.user;

  if (user.status !== "ACTIVE") {
    await prisma.session.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        revokedReason: "SUSPENDED",
      },
    });

    return { kind: "SUSPENDED" };
  }

  if (
    user.corporateAccountId &&
    user.corporateAccount &&
    user.corporateAccount.status !== "ACTIVE"
  ) {
    await prisma.session.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        revokedReason: "SUSPENDED",
      },
    });

    return { kind: "SUSPENDED" };
  }

  const now = new Date();

  /**
   * 3️⃣ FIRST-USE INITIALIZATION (CRITICAL FIX)
   *
   * If lastSeenAt is null, this is the FIRST authenticated request.
   * We must initialize the sliding window and allow the session.
   */
  if (!session.lastSeenAt) {
    await prisma.session.update({
      where: { id: session.id },
      data: {
        lastSeenAt: now,
        expiresAt: getSessionExpiry(),
      },
    });

    return { kind: "VALID", session };
  }

  /**
   * 4️⃣ STRICT inactivity timeout (AFTER first use)
   */
  const timeoutMinutes =
    Number(process.env.SESSION_TIMEOUT_MINUTES) || 60;

  const inactivityDeadline = new Date(
    session.lastSeenAt.getTime() +
    timeoutMinutes * 60 * 1000
  );

  if (now > inactivityDeadline) {
    await prisma.session.update({
      where: { id: session.id },
      data: {
        revokedAt: now,
        revokedReason: "TIMEOUT",
      },
    });

    return { kind: "INVALID" };
  }

  /**
   * 5️⃣ Sliding window refresh (valid session)
   */
  await prisma.session.update({
    where: { id: session.id },
    data: {
      lastSeenAt: now,
      expiresAt: getSessionExpiry(),
    },
  });

  return { kind: "VALID", session };
}
