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
 * - null if not authorized
 *
 * IMPORTANT:
 * - Backward compatible with existing callers
 * - Handles RequireSessionResult correctly
 */
export async function requireCorporateAdmin(sessionId: string | null) {
  const result = await requireSession(sessionId);

  // ❌ No valid session
  if (result.kind !== "VALID") {
    return null;
  }

  const session = result.session;
  const user = session.user;

  // ❌ Not a corporate user
  if (!user.corporateAccountId) {
    return null;
  }

  // ❌ Not an admin
  if (user.role !== "ADMIN") {
    return null;
  }

  // ✅ Authorized corporate admin
  return session;
}
