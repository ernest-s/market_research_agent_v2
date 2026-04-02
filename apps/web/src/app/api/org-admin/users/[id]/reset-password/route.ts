import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCorporateAdmin } from "@/lib/requireCorporateAdmin";
import { revokeUserSessions } from "@/lib/session";
import { setAuth0UserBlocked } from "@/lib/auth0Management";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    /**
     * 1️⃣ Require corporate admin session
     */
    const sessionId =
        req.cookies.get("app_session_id")?.value ?? null;

    const session = await requireCorporateAdmin(sessionId);

    if (!session) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    /**
     * 2️⃣ Resolve target user ID
     */
    const { id: targetUserId } = await context.params;

    /**
     * 🚫 Admin cannot reset their own password here
     */
    if (targetUserId === session.user.id) {
        return NextResponse.json(
            { error: "Use Account page to reset your own password" },
            { status: 400 }
        );
    }

    /**
     * 3️⃣ Load target user
     */
    const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
    });

    if (!targetUser) {
        return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
        );
    }

    /**
     * 🚫 Must belong to same corporate account
     */
    if (
        targetUser.corporateAccountId !==
        session.user.corporateAccountId
    ) {
        return NextResponse.json(
            { error: "Forbidden" },
            { status: 403 }
        );
    }

    /**
     * 🚫 Only ACTIVE users
     */
    if (targetUser.status !== "ACTIVE") {
        return NextResponse.json(
            { error: "Password reset allowed only for active users" },
            { status: 400 }
        );
    }

    /**
     * 🚫 Guard against missing Auth0 identity
     */
    if (!targetUser.auth0Sub) {
        return NextResponse.json(
            { error: "User has no Auth0 identity" },
            { status: 500 }
        );
    }

    /**
     * 4️⃣ Block user in Auth0
     *
     * Prevents login with old password until they complete the reset.
     */
    try {
        await setAuth0UserBlocked(targetUser.auth0Sub, true);
    } catch (err) {
        console.error("Failed to block Auth0 user:", err);
        return NextResponse.json(
            { error: "Failed to block user — password reset aborted" },
            { status: 500 }
        );
    }

    /**
     * 5️⃣ Trigger Auth0 password reset email
     *
     * If this fails, unblock the user to restore their previous access.
     */
    const resetRes = await fetch(
        `https://${process.env.AUTH0_ISSUER_BASE_URL!.replace(
            "https://",
            ""
        )}/dbconnections/change_password`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                client_id: process.env.AUTH0_CLIENT_ID,
                email: targetUser.email,
                connection: "Username-Password-Authentication",
            }),
        }
    );

    if (!resetRes.ok) {
        const text = await resetRes.text();
        console.error("Reset password error:", text);

        // Compensating action: unblock since email failed
        try {
            await setAuth0UserBlocked(targetUser.auth0Sub, false);
        } catch (unblockErr) {
            console.error("Failed to unblock Auth0 user after email failure:", unblockErr);
        }

        return NextResponse.json(
            { error: "Failed to send password reset email" },
            { status: 500 }
        );
    }

    /**
     * 6️⃣ Revoke all active app sessions
     *
     * Forces the user off the app immediately.
     */
    await revokeUserSessions(targetUser.id, "LOGOUT");

    /**
     * 🧾 7️⃣ Admin audit log (append-only)
     */
    await prisma.adminAuditLog.create({
        data: {
            actorUserId: session.user.id,
            actorEmail: session.user.email,
            action: "PASSWORD_RESET_TRIGGERED",
            entityType: "User",
            entityId: targetUser.id,
            corporateAccountId: session.user.corporateAccountId,
            metadata: {
                targetUserEmail: targetUser.email,
                auth0Blocked: true,
            },
        },
    });

    return NextResponse.json({ success: true });
}
