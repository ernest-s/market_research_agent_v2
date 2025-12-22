import { NextResponse } from "next/server";

export function GET(req: Request) {
  const url = new URL(req.url);
  const screenHint = url.searchParams.get("screen_hint");

  const params = new URLSearchParams({
    client_id: process.env.AUTH0_CLIENT_ID!,
    response_type: "code",
    scope: "openid profile email",
    redirect_uri: `${process.env.AUTH0_BASE_URL}/api/auth/callback`,
  });

  if (screenHint === "signup") {
    params.set("screen_hint", "signup");
  }

  const authorizeUrl = `${process.env.AUTH0_ISSUER_BASE_URL}/authorize?${params.toString()}`;

  return NextResponse.redirect(authorizeUrl);
}
