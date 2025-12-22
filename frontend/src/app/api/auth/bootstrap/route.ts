import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type IdTokenPayload = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Read ID token from HttpOnly cookie
    const idToken = req.cookies.get("auth0_id_token")?.value;

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Decode token (no signature verification needed here)
    const decoded = jwt.decode(idToken) as IdTokenPayload | null;

    if (!decoded?.sub || !decoded?.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    const enforceVerification =
      process.env.NEXT_PUBLIC_ENFORCE_EMAIL_VERIFICATION === "true";

    if (enforceVerification && decoded.email_verified !== true) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    const { sub, email } = decoded;

    // 3️⃣ Try lookup by auth0Sub first
    let user = await prisma.user.findUnique({
      where: { auth0Sub: sub },
    });

    // 4️⃣ If not found, try linking by email
    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingByEmail) {
        // 🔗 Link new Auth0 identity to existing user
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { auth0Sub: sub },
        });
      } else {
        // 🆕 Create brand-new user
        user = await prisma.user.create({
          data: {
            auth0Sub: sub,
            email,
          },
        });
      }
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Bootstrap error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
