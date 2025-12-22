import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Extract Auth0 subject from access token
 */
function getAuth0Sub(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.decode(token) as { sub?: string } | null;
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}

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
    throw new Error("Failed to obtain Auth0 management token");
  }

  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const auth0Sub = getAuth0Sub(req);

    if (!auth0Sub) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const mgmtToken = await getManagementToken();

    const res = await fetch(
      `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/jobs/verification-email`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mgmtToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: auth0Sub,
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
