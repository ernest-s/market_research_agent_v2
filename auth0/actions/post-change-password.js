/**
 * Auth0 Action: Unblock user after successful password reset
 *
 * Trigger:    Post Change Password
 * Flow:       Password Reset
 *
 * When an admin triggers a password reset, the app blocks the user in Auth0
 * to prevent login with the old password. This action unblocks them once they
 * successfully set a new password.
 *
 * Required secrets (configure in Auth0 Dashboard > Actions > [this action] > Secrets):
 *   AUTH0_MANAGEMENT_DOMAIN       e.g. dev-xxxx.us.auth0.com
 *   AUTH0_MANAGEMENT_CLIENT_ID    M2M application client ID
 *   AUTH0_MANAGEMENT_CLIENT_SECRET  M2M application client secret
 */

exports.onExecutePostChangePassword = async (event) => {
  const userId = event.user.user_id;
  if (!userId) {
    console.error("post-change-password: missing user_id");
    return;
  }

  // Get a Management API token
  // @type {any} cast avoids Auth0 editor's Response type conflict with native fetch
  /** @type {any} */
  const tokenRes = await fetch(
    `https://${event.secrets.AUTH0_MANAGEMENT_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: event.secrets.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: event.secrets.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `https://${event.secrets.AUTH0_MANAGEMENT_DOMAIN}/api/v2/`,
      }),
    }
  );

  if (!tokenRes.ok) {
    console.error("post-change-password: failed to get management token");
    return;
  }

  const { access_token } = await tokenRes.json();

  // Unblock the user now that they have a new password
  /** @type {any} */
  const unblockRes = await fetch(
    `https://${event.secrets.AUTH0_MANAGEMENT_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ blocked: false }),
    }
  );

  if (!unblockRes.ok) {
    console.error("post-change-password: failed to unblock user", userId);
  }
};
