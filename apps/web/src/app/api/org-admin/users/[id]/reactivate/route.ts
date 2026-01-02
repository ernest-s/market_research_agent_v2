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
   * 🚫 Admin cannot reactivate themselves (defensive)
   */
  if (targetUserId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot reactivate yourself" },
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
   * ✅ Already active → no-op
   */
  if (targetUser.status === "ACTIVE") {
    return NextResponse.json({ success: true });
  }

  /**
   * 🚫 Cannot reactivate DELETED users
   */
  if (targetUser.status === "DELETED") {
    return NextResponse.json(
      { error: "Deleted users cannot be reactivated" },
      { status: 400 }
    );
  }

  /**
   * 4️⃣ Reactivate user
   */
  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      status: "ACTIVE",
    },
  });

  /**
   * 🧾 5️⃣ Admin audit log (SUCCESS ONLY)
   */
  await prisma.adminAuditLog.create({
    data: {
      actorUserId: session.user.id,
      actorEmail: session.user.email,
      action: "USER_REACTIVATED",
      entityType: "User",
      entityId: targetUserId,
      corporateAccountId: session.user.corporateAccountId,
      metadata: {
        reactivatedUserEmail: targetUser.email,
        previousStatus: targetUser.status,
      },
    },
  });

  return NextResponse.json({ success: true });
}
