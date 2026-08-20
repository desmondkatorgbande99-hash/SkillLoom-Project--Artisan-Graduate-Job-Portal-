import prisma from "./config/database";

async function testDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect();

    const result = await prisma.$queryRaw<
      Array<{ connection_test: number }>
    >`SELECT 1 AS connection_test`;

    console.log("✅ SkillLoom database connection successful.");
    console.log("Database test:", result);
  } catch (error) {
    console.error("❌ SkillLoom database connection failed.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();