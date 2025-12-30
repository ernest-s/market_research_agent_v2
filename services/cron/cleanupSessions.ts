/**
 * Session cleanup cron job
 *
 * Safe to run repeatedly.
 * Intended to be executed by a scheduler (cron / Cloud Scheduler / CI).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Configuration
 */
const SESSION_HISTORY_LIMIT = 100;
const REVOKED_RETENTION_DAYS = 7;

async function cleanupSessions() {
  const now = new Date();

  console.log("🧹 Session cleanup started at", now.toISOString());

  /**
   * 1️⃣ Delete expired sessions
   */
  const expiredResult = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  console.log(
    `🗑️ Deleted ${expiredResult.count} expired sessions`
  );

  /**
   * 2️⃣ Delete old revoked sessions
   */
  const revokedBefore = new Date(
    now.getTime() - REVOKED_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  const revokedResult = await prisma.session.deleteMany({
    where: {
      revokedAt: {
        not: null,
        lt: revokedBefore,
      },
    },
  });

  console.log(
    `🗑️ Deleted ${revokedResult.count} old revoked sessions`
  );

  /**
   * 3️⃣ Enforce per-user session history limit
   */
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  let trimmedCount = 0;

  for (const user of users) {
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: SESSION_HISTORY_LIMIT,
      select: { id: true },
    });

    if (sessions.length > 0) {
      const deleteResult = await prisma.session.deleteMany({
        where: {
          id: {
            in: sessions.map((s) => s.id),
          },
        },
      });

      trimmedCount += deleteResult.count;
    }
  }

  console.log(
    `✂️ Trimmed ${trimmedCount} old sessions beyond history limit`
  );

  console.log("✅ Session cleanup completed");
}

/**
 * Entry point
 */
cleanupSessions()
  .catch((err) => {
    console.error("❌ Session cleanup failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
