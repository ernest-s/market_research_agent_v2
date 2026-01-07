import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/requireSession";

const APP_SESSION_COOKIE = "app_session_id";

/**
 * POST /api/auth/revalidate
 *
 * Called on every in-app navigation to:
 * - enforce inactivity timeout
 * - refresh sliding expiration if still valid
 */
export async function POST() {
    // ✅ cookies() is async in route handlers
    const cookieStore = await cookies();

    const sessionId =
        cookieStore.get(APP_SESSION_COOKIE)?.value ?? null;

    const result = await requireSession(sessionId);

    if (result.kind === "INVALID") {
        return NextResponse.json(
            { error: "UNAUTHENTICATED" },
            { status: 401 }
        );
    }

    if (result.kind === "SUSPENDED") {
        return NextResponse.json(
            { error: "ACCOUNT_SUSPENDED" },
            { status: 403 }
        );
    }

    // VALID session → requireSession already refreshed lastSeenAt / expiresAt
    return NextResponse.json({ ok: true }, { status: 200 });
}
