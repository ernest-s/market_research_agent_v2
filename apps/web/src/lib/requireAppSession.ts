import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/requireSession";

const APP_SESSION_COOKIE = "app_session_id";

export async function requireAppSession() {
    // Read cookies from the incoming request (server-side)
    const cookieStore = await cookies();

    const sessionId =
        cookieStore.get(APP_SESSION_COOKIE)?.value ?? null;

    // Validate session against DB + business rules
    const session = await requireSession(sessionId);

    // No valid app session → force login
    if (!session) {
        redirect("/login");
    }

    // Valid session → allow render
    return session;
}
