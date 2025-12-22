import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type IdTokenPayload = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

/**
 * Extract and decode ID token from cookie
 */
function getAuthFromRequest(req: NextRequest): IdTokenPayload | null {
  const token = req.cookies.get("auth0_id_token")?.value;
  if (!token) return null;

  const decoded = jwt.decode(token) as IdTokenPayload | null;
  if (!decoded?.sub) return null;

  return decoded;
}

/**
 * GET /api/user/profile
 * ❌ MUST NOT enforce email verification
 */
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { auth0Sub: auth.sub },
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
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const enforceVerification =
      process.env.NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION === "true";

    if (enforceVerification && auth.email_verified !== true) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    const { firstName, lastName, companyName } = await req.json();

    const user = await prisma.user.findUnique({
      where: { auth0Sub: auth.sub },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let companyId: string | null = user.companyId;

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

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
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
