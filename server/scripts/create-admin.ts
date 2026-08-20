import prisma from "../src/config/database";
import { hashPassword } from "../src/utils/password";

async function main() {
  const email = "admin.test@skillloom.com";
  const password = "Admin123!";
  const fullName = "SkillLoom Administrator";

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Admin account already exists.");
    console.log({
      email: existingUser.email,
      role: existingUser.role,
      status: existingUser.status,
      isEmailVerified: existingUser.isEmailVerified,
    });
    return;
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      isEmailVerified: true,
    },
  });

  console.log("Admin account created successfully.");
  console.log({
    id: admin.id,
    fullName: admin.fullName,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    isEmailVerified: admin.isEmailVerified,
  });
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
