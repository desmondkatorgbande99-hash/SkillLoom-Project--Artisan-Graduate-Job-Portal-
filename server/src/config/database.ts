import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

function createDatabaseAdapter(): PrismaMariaDb {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      if (!url.searchParams.has("allowPublicKeyRetrieval")) {
        url.searchParams.set("allowPublicKeyRetrieval", "true");
      }
      return new PrismaMariaDb(url.toString());
    } catch {
      return new PrismaMariaDb(databaseUrl);
    }
  }

  return new PrismaMariaDb({
    host: process.env.DATABASE_HOST || "localhost",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "skillloom_db",
    allowPublicKeyRetrieval: true,
  });
}

const adapter = createDatabaseAdapter();

const prisma = new PrismaClient({
  adapter,
});

export default prisma;