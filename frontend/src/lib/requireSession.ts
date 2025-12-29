import { prisma } from "@/lib/prisma";
import { getSessionExpiry } from "@/lib/session";

export async function requireSession(sessionId: string | null) {
  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Revoked
  if (session.revokedAt) {
    return null;
  }

  // Expired
  if (session.expiresAt <= new Date()) {
    await prisma.session.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        revokedReason: "TIMEOUT",
      },
    });
    return null;
  }

  // Sliding timeout refresh
  await prisma.session.update({
    where: { id: session.id },
    data: {
      lastSeenAt: new Date(),
      expiresAt: getSessionExpiry(),
    },
  });

  return session;
}
