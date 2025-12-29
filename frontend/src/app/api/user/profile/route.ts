import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/requireSession";

/**
 * GET /api/user/profile
 * ❌ MUST NOT enforce email verification
 * 🔒 MUST enforce valid app session
 */
export async function GET(req: NextRequest) {
  try {
    /**
     * 1️⃣ Require valid app session
     */
    const sessionId = req.cookies.get("app_session_id")?.value ?? null;
    const session = await requireSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /**
     * 2️⃣ Load user profile
     */
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.company?.name ?? "",
    });
  } catch (err) {
    console.error("Get profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * ✅ Email verification enforced here
 * 🔒 MUST enforce valid app session
 */
export async function PATCH(req: NextRequest) {
  try {
    /**
     * 1️⃣ Require valid app session
     */
    const sessionId = req.cookies.get("app_session_id")?.value ?? null;
    const session = await requireSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /**
     * 2️⃣ Enforce email verification (unchanged behavior)
     */
    const enforceVerification =
      process.env.NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION === "true";

    if (enforceVerification && session.user.emailVerified !== true) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    /**
     * 3️⃣ Parse request body
     */
    const { firstName, lastName, companyName } = await req.json();

    /**
     * 4️⃣ Resolve company (unchanged logic)
     */
    let companyId: string | null = session.user.companyId;

    if (typeof companyName === "string") {
      const trimmed = companyName.trim();

      if (!trimmed) {
        companyId = null;
      } else {
        const existingCompany = await prisma.company.findFirst({
          where: {
            name: { equals: trimmed, mode: "insensitive" },
          },
        });

        const company =
          existingCompany ??
          (await prisma.company.create({
            data: { name: trimmed },
          }));

        companyId = company.id;
      }
    }

    /**
     * 5️⃣ Update user
     */
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        companyId,
      },
      include: { company: true },
    });

    return NextResponse.json({
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      companyName: updatedUser.company?.name ?? "",
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
