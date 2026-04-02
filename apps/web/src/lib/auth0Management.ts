export async function getManagementToken(): Promise<string> {
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

export async function setAuth0UserBlocked(
  auth0Sub: string,
  blocked: boolean
): Promise<void> {
  const token = await getManagementToken();

  const res = await fetch(
    `https://${process.env.AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/${encodeURIComponent(auth0Sub)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ blocked }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to ${blocked ? "block" : "unblock"} Auth0 user: ${text}`);
  }
}
