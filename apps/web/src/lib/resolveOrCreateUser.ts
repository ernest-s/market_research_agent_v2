import { prisma } from "@/lib/prisma";

/**
 * Resolve an existing user by Auth0 sub, fall back to email match,
 * or create a new user. Priority:
 *   1. auth0Sub match
 *   2. email match → attach new auth0Sub
 *   3. create new user
 */
export async function resolveOrCreateUser(sub: string, email: string) {
  let user = await prisma.user.findUnique({ where: { auth0Sub: sub } });

  if (!user) {
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { auth0Sub: sub },
      });
    } else {
      user = await prisma.user.create({
        data: { auth0Sub: sub, email, status: "ACTIVE" },
      });
    }
  }

  return user;
}
