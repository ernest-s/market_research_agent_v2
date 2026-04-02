import { Prisma } from "@prisma/client";
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
 * - SINGLE-SESSION conflict detection (NON-DESTRUCTIVE)
 *
 * IMPORTANT BEHAVIOR:
 * - A session is ALWAYS valid on its first authenticated request.
 * - Inactivity timeout is enforced ONLY after first use.
 * - Session conflict is DETECTED here, but ENFORCED elsewhere.
 */

export type AppSession = Prisma.SessionGetPayload<{
  include: {
    user: {
      include: {
        corporateAccount: true;
      };
    };
  };
}>;

export type RequireSessionResult =
  | { kind: "VALID"; session: AppSession }
  | { kind: "SUSPENDED" }
  | { kind: "INVALID" }
  | { kind: "SESSION_CONFLICT"; session: AppSession };

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
   * 3️⃣ FIRST-USE INITIALIZATION
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
   * 5️⃣ SINGLE-SESSION CONFLICT DETECTION (READ-ONLY)
   *
   * Detect another active session for the same user.
   * Do NOT revoke anything here.
   */
  const otherActiveSession = await prisma.session.findFirst({
    where: {
      userId: session.userId,
      revokedAt: null,
      expiresAt: { gt: now },
      NOT: { id: session.id },
    },
    select: { id: true },
  });

  if (otherActiveSession) {
    return { kind: "SESSION_CONFLICT", session };
  }

  /**
   * 6️⃣ Sliding window refresh (valid session)
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
