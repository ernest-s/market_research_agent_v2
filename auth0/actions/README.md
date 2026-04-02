# Auth0 Actions

Actions in this directory are deployed manually via the Auth0 Dashboard.
They are not part of the Next.js build.

## Deployment steps

1. Go to **Auth0 Dashboard > Actions > Library**
2. Click **Build Custom Action**
3. Give it a name, select the trigger (see table below), click **Create**
4. Paste the contents of the corresponding `.js` file
5. Under **Secrets**, add each required secret (see table below)
6. Click **Deploy**
7. Go to **Actions > Flows**, open the matching flow, and drag the action into the flow

## Actions

### `post-change-password.js`

| Property | Value |
|---|---|
| Trigger | Post Change Password |
| Flow | Password Reset |
| Purpose | Unblocks a user in Auth0 after they successfully reset their password. When an admin triggers a forced password reset the app blocks the user to prevent login with the old password. This action lifts the block once the new password is set. |

**Required secrets:**

| Secret name | Where to find it |
|---|---|
| `AUTH0_MANAGEMENT_DOMAIN` | `AUTH0_MANAGEMENT_DOMAIN` in `apps/web/.env.local` |
| `AUTH0_MANAGEMENT_CLIENT_ID` | `AUTH0_MANAGEMENT_CLIENT_ID` in `apps/web/.env.local` |
| `AUTH0_MANAGEMENT_CLIENT_SECRET` | `AUTH0_MANAGEMENT_CLIENT_SECRET` in `apps/web/.env.local` |


