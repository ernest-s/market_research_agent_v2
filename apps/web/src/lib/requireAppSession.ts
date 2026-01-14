import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/requireSession";

const APP_SESSION_COOKIE = "app_session_id";

/**
 * requireAppSession
 *
 * Centralized access control for all authenticated app routes.
 *
 * Responsibilities:
 * - Read session cookie
 * - Delegate validation to requireSession
 * - Translate session states into routing decisions
 *
 * IMPORTANT:
 * - Layouts and pages must NOT contain auth logic
 */
export async function requireAppSession() {
    const cookieStore = await cookies();

    const sessionId =
        cookieStore.get(APP_SESSION_COOKIE)?.value ?? null;

    const result = await requireSession(sessionId);

    /**
     * ❌ No valid session (expired / missing / revoked)
     * → Force logout (clears IdP + app cookies)
     */
    if (result.kind === "INVALID") {
        redirect("/auth/logout");
    }

    /**
     * ⛔ Authenticated but suspended
     */
    if (result.kind === "SUSPENDED") {
        redirect("/account-suspended");
    }

    /**
     * ⚠️ Single-session conflict detected
     *
     * Another active session exists for this user.
     * Block app access and route to conflict resolution page.
     */
    if (result.kind === "SESSION_CONFLICT") {
        redirect("/session-conflict");
    }

    /**
     * ✅ Valid session → allow render
     */
    return result.session;
}
