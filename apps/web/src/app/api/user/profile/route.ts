import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/requireSession";

const APP_SESSION_COOKIE = "app_session_id";

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
    const sessionId =
      req.cookies.get(APP_SESSION_COOKIE)?.value ?? null;

    const result = await requireSession(sessionId);

    if (result.kind === "INVALID") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (result.kind === "SUSPENDED") {
      return NextResponse.json(
        { error: "ACCOUNT_SUSPENDED" },
        { status: 403 }
      );
    }

    // ✅ VALID session
    const session = result.session;

    /**
     * 2️⃣ Load user profile with corporate context
     */
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: true,
        corporateAccount: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isCorporateUser = Boolean(user.corporateAccountId);

    return NextResponse.json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.company?.name ?? "",
      accountType: isCorporateUser ? "CORPORATE" : "INDIVIDUAL",
      isCompanyEditable: !isCorporateUser,
      plan: user.plan,
      role: user.role, // read-only exposure
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
 * ❌ Email verification NOT enforced
 * 🔒 MUST enforce valid app session
 */
export async function PATCH(req: NextRequest) {
  try {
    /**
     * 1️⃣ Require valid app session
     */
    const sessionId =
      req.cookies.get(APP_SESSION_COOKIE)?.value ?? null;

    const result = await requireSession(sessionId);

    if (result.kind === "INVALID") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (result.kind === "SUSPENDED") {
      return NextResponse.json(
        { error: "ACCOUNT_SUSPENDED" },
        { status: 403 }
      );
    }

    // ✅ VALID session
    const session = result.session;

    /**
     * 2️⃣ Load user with corporate context
     */
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        company: true,
        corporateAccount: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const isCorporateUser = Boolean(user.corporateAccountId);

    /**
     * 3️⃣ Parse request body
     */
    const { firstName, lastName, companyName } = await req.json();

    /**
     * 4️⃣ Resolve company
     * ❌ Corporate users cannot change company
     */
    let companyId: string | null = user.companyId;

    if (!isCorporateUser && typeof companyName === "string") {
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
      where: { id: user.id },
      data: {
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        companyId,
      },
      include: {
        company: true,
        corporateAccount: true,
      },
    });

    return NextResponse.json({
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      companyName: updatedUser.company?.name ?? "",
      accountType: isCorporateUser ? "CORPORATE" : "INDIVIDUAL",
      isCompanyEditable: !isCorporateUser,
      plan: updatedUser.plan,
      role: updatedUser.role,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
