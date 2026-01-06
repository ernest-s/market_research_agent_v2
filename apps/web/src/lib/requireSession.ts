import { prisma } from "@/lib/prisma";
import { getSessionExpiry } from "@/lib/session";

/**
 * requireSession
 *
 * Enforces:
 * - session existence
 * - revocation
 * - sliding inactivity timeout (STRICT)
 * - user + corporate account ACTIVE status
 *
 * IMPORTANT BEHAVIOR:
 * - If the user is inactive beyond SESSION_TIMEOUT_MINUTES,
 *   the FIRST request AFTER inactivity FAILS.
 * - Sessions are only refreshed if they were already valid.
 * - Suspended users / accounts are immediately cut off.
 */

/**
 * Result type that PRESERVES why a session failed.
 * This is critical for correct routing behavior.
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

  // User must be ACTIVE
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

  // If corporate user, corporate account must also be ACTIVE
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
   * 3️⃣ STRICT inactivity timeout check
   */
  if (session.lastSeenAt) {
    const timeoutMinutes =
      Number(process.env.SESSION_TIMEOUT_MINUTES) || 60;

    const inactivityDeadline = new Date(
      session.lastSeenAt.getTime() +
      timeoutMinutes * 60 * 1000
    );

    if (now > inactivityDeadline) {
      // Revoke immediately so other tabs/devices are cut off
      await prisma.session.update({
        where: { id: session.id },
        data: {
          revokedAt: now,
          revokedReason: "TIMEOUT",
        },
      });

      return { kind: "INVALID" };
    }
  }

  /**
   * 4️⃣ Sliding window refresh
   *
   * ONLY happens if session was already valid.
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
