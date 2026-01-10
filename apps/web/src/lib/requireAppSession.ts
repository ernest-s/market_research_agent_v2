import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/requireSession";

const APP_SESSION_COOKIE = "app_session_id";

export async function requireAppSession() {
    const cookieStore = await cookies();

    const sessionId =
        cookieStore.get(APP_SESSION_COOKIE)?.value ?? null;

    const result = await requireSession(sessionId);

    /**
     * ❌ No valid session (expired / missing / revoked)
     * → Force full logout to clear IdP session
     */
    if (result.kind === "INVALID") {
        redirect("/login?reason=timeout");
    }


    /**
     * ⛔ Authenticated but suspended
     */
    if (result.kind === "SUSPENDED") {
        redirect("/account-suspended");
    }

    /**
     * ✅ Valid session → allow render
     */
    return result.session;
}
