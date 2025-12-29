import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type IdTokenPayload = {
  sub?: string;
};

/**
 * Get Auth0 Management API token
 */
async function getManagementToken(): Promise<string> {
  const res = await fetch(
    `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to obtain management token:", text);
    throw new Error("Failed to obtain Auth0 management token");
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Read ID token from cookie (same as bootstrap)
    const idToken = req.cookies.get("auth0_id_token")?.value;

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Decode token to get Auth0 user id
    const decoded = jwt.decode(idToken) as IdTokenPayload | null;

    if (!decoded?.sub) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // 3️⃣ Get Auth0 Management API token
    const mgmtToken = await getManagementToken();

    // 4️⃣ Trigger verification email
    const res = await fetch(
      `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/jobs/verification-email`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mgmtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: decoded.sub,
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Auth0 resend error:", text);
      return NextResponse.json(
        { error: "Failed to resend verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
