import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/requireSession";

const APP_SESSION_COOKIE = "app_session_id";

export async function requireAppSession() {
    // Read cookies from the incoming request (server-side)
    const cookieStore = await cookies();

    const sessionId =
        cookieStore.get(APP_SESSION_COOKIE)?.value ?? null;

    const result = await requireSession(sessionId);

    /**
     * ❌ No valid session → force login
     */
    if (result.kind === "INVALID") {
        redirect("/login");
    }

    /**
     * ⛔ Authenticated but suspended → account suspended page
     */
    if (result.kind === "SUSPENDED") {
        redirect("/account-suspended");
    }

    /**
     * ✅ Valid session → allow render
     */
    return result.session;
}
