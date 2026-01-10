import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type IdTokenPayload = {
  sub?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    /**
     * 1️⃣ Read Auth0 identity
     *
     * Assumption:
     * - Session validity is already enforced upstream
     */
    const idToken = req.cookies.get("auth0_id_token")?.value;

    if (!idToken) {
      throw new Error("Missing Auth0 ID token");
    }

    const decoded = jwt.decode(idToken) as IdTokenPayload | null;

    if (!decoded?.sub || !decoded?.email) {
      throw new Error("Invalid Auth0 ID token");
    }

    const { sub, email } = decoded;

    /**
     * 2️⃣ Resolve user (Auth0 ↔ DB reconciliation)
     */
    let user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: {
        company: true,
        corporateAccount: true,
      },
    });

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { auth0Sub: sub },
          include: {
            company: true,
            corporateAccount: true,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            auth0Sub: sub,
            email,
            status: "ACTIVE",
          },
          include: {
            company: true,
            corporateAccount: true,
          },
        });
      }
    }

    /**
     * 3️⃣ Determine account context (data only)
     */
    const isCorporateUser = Boolean(user.corporateAccountId);

    const accountContext = {
      accountType: isCorporateUser ? "CORPORATE" : "INDIVIDUAL",
      corporateAccount: isCorporateUser
        ? {
          id: user.corporateAccount!.id,
          name: user.corporateAccount!.name,
          status: user.corporateAccount!.status,
        }
        : null,
    };

    /**
     * 4️⃣ Return enriched response
     */
    return NextResponse.json({
      user,
      ...accountContext,
    });
  } catch (err) {
    console.error("Bootstrap fatal error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
