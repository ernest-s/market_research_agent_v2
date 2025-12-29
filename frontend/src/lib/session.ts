import { prisma } from "@/lib/prisma";

const SESSION_TIMEOUT_MINUTES = Number(
  process.env.SESSION_TIMEOUT_MINUTES || 60
);

export function getSessionExpiry() {
  return new Date(Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000);
}

export async function revokeUserSessions(
  userId: string,
  reason: "OVERRIDDEN" | "LOGOUT" | "TIMEOUT"
) {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      revokedReason: reason,
    },
  });
}
