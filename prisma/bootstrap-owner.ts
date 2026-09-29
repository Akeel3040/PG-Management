import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const email = process.env.INITIAL_OWNER_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_OWNER_PASSWORD;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid INITIAL_OWNER_EMAIL is required.");
  }
  if (!password || password.length < 14) {
    throw new Error("INITIAL_OWNER_PASSWORD must be at least 14 characters.");
  }

  await prisma.$transaction(async (transaction) => {
    if (await transaction.user.count()) {
      throw new Error("Owner bootstrap refused: the database already has users.");
    }

    await transaction.user.create({
      data: {
        email,
        password: await bcrypt.hash(password, 12),
        name: email.split("@")[0],
        role: "OWNER",
        status: "ACTIVE",
      },
    });
  });

  console.log(`Created initial Owner account for ${email}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Initial Owner bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });