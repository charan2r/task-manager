import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

async function main() {
  const adminEmail = "admin44@gmail.com";
  const adminPassword = "admin123";
  const adminName = "System Admin";

  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail.toLowerCase(),
    },
  });

  if (existingAdmin) {
    console.log(`Admin account already exists: ${existingAdmin.email}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail.toLowerCase(),
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log("Admin created:", admin);
}

main()
  .catch((error) => {
    console.error("Admin seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
