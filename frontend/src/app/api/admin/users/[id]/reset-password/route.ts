import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCorporateAdmin } from "@/lib/requireCorporateAdmin";

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
     * 4️⃣ Trigger Auth0 password reset email
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

        return NextResponse.json(
            { error: "Failed to send password reset email" },
            { status: 500 }
        );
    }

    /**
     * 🧾 5️⃣ Admin audit log (append-only)
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
            },
        },
    });

    return NextResponse.json({ success: true });
}
