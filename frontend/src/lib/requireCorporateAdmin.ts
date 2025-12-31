import { requireSession } from "@/lib/requireSession";

/**
 * requireCorporateAdmin
 *
 * Enforces:
 * - valid app session
 * - user belongs to a corporate account
 * - user role === ADMIN
 *
 * Returns:
 * - session with user + corporateAccount loaded
 */
export async function requireCorporateAdmin(sessionId: string | null) {
  const session = await requireSession(sessionId);

  if (!session) {
    return null;
  }

  const user = session.user;

  if (!user.corporateAccountId) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return null;
  }

  return session;
}
