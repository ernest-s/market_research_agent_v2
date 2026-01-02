const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const updates = [
    {
      email: "ernest.kirubakaran@gmail.com",
      firstName: "Ernest",
      lastName: "Kirubakaran",
    },
    {
      email: "nagaking@gmail.com",
      firstName: "Naga",
      lastName: "King",
    },
  ];

  for (const u of updates) {
    await prisma.user.updateMany({
      where: { email: u.email },
      data: {
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });
  }

  console.log("Backfill complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
