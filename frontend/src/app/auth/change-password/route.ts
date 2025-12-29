import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type IdTokenPayload = {
  email?: string;
};

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Read ID token from cookie
    const idToken = req.cookies.get("auth0_id_token")?.value;

    if (!idToken) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    // 2️⃣ Decode email from token
    const decoded = jwt.decode(idToken) as IdTokenPayload | null;

    if (!decoded?.email) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    // 3️⃣ Trigger Auth0 password reset email
    const res = await fetch(
      `https://${process.env.AUTH0_ISSUER_BASE_URL.replace("https://", "")}/dbconnections/change_password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          email: decoded.email,
          connection: "Username-Password-Authentication",
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Auth0 change password error:", text);
      return NextResponse.redirect(
        new URL("/profile?passwordError=1", req.url)
      );
    }

    // 4️⃣ Redirect back to profile with success flag
    return NextResponse.redirect(
      new URL("/profile?passwordSent=1", req.url)
    );
  } catch (err) {
    console.error("Change password error:", err);
    return NextResponse.redirect(
      new URL("/profile?passwordError=1", req.url)
    );
  }
}
