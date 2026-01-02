import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCorporateAdmin } from "@/lib/requireCorporateAdmin";

/**
 * Helper: get Auth0 Management API token
 */
async function getManagementToken() {
  const res = await fetch(
    `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/`,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get management token: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

/**
 * GET /api/org-admin/users
 */
export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("app_session_id")?.value ?? null;
  const session = await requireCorporateAdmin(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      corporateAccountId: session.user.corporateAccountId!,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

/**
 * POST /api/org-admin/users
 * Invite a NEW MEMBER user only
 */
export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("app_session_id")?.value ?? null;
  const session = await requireCorporateAdmin(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, firstName, lastName } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const corporateAccountId = session.user.corporateAccountId!;
  const companyId = session.user.companyId!;

  /**
   * 1️⃣ Check existing user
   */
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (
    existingUser &&
    existingUser.corporateAccountId === corporateAccountId
  ) {
    return NextResponse.json(
      { error: "User already exists in your corporate account." },
      { status: 409 }
    );
  }

  if (existingUser) {
    return NextResponse.json(
      {
        error:
          "This email already belongs to an existing account. Please contact support.",
      },
      { status: 409 }
    );
  }

  try {
    const token = await getManagementToken();

    /**
     * 2️⃣ Create Auth0 user
     */
    const createUserRes = await fetch(
      `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/users`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connection: "Username-Password-Authentication",
          email: normalizedEmail,
          email_verified: true,
          verify_email: false,
          password: crypto.randomUUID(),
          given_name: firstName,
          family_name: lastName,
        }),
      }
    );

    if (!createUserRes.ok) {
      const text = await createUserRes.text();
      return NextResponse.json(
        { error: `Auth0 user creation failed: ${text}` },
        { status: 400 }
      );
    }

    const auth0User = await createUserRes.json();

    /**
     * 3️⃣ Create DB user
     */
    const createdUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        auth0Sub: auth0User.user_id,
        firstName,
        lastName,
        role: "MEMBER",
        plan: "CORPORATE",
        status: "ACTIVE",
        corporateAccountId,
        companyId,
      },
    });

    /**
     * 4️⃣ Send password setup email
     */
    const resetRes = await fetch(
      `https://${process.env.AUTH0_ISSUER_BASE_URL.replace(
        "https://",
        ""
      )}/dbconnections/change_password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          email: normalizedEmail,
          connection: "Username-Password-Authentication",
        }),
      }
    );

    if (!resetRes.ok) {
      const text = await resetRes.text();
      return NextResponse.json(
        { error: `Failed to send invite email: ${text}` },
        { status: 400 }
      );
    }

    /**
     * 🧾 5️⃣ Admin audit log
     */
    await prisma.adminAuditLog.create({
      data: {
        actorUserId: session.user.id,
        actorEmail: session.user.email,
        action: "USER_INVITED",
        entityType: "User",
        entityId: createdUser.id,
        corporateAccountId,
        metadata: {
          invitedEmail: normalizedEmail,
          firstName,
          lastName,
        },
      },
    });

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
    });
  } catch (err) {
    console.error("Invite user error:", err);
    return NextResponse.json(
      { error: "Failed to invite user" },
      { status: 500 }
    );
  }
}
