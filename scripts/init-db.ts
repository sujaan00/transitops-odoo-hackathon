import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function splitSql(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const migrationPath = join(process.cwd(), "prisma", "migrations", "000001_init", "migration.sql");
  const sql = readFileSync(migrationPath, "utf8");

  for (const statement of splitSql(sql)) {
    await prisma.$executeRawUnsafe(statement);
  }

  console.log("Database schema initialized from prisma/migrations/000001_init/migration.sql");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
