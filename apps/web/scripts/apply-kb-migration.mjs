import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

const migrationSql = fs.readFileSync(
  path.resolve(__dirname, "../prisma/migrations/20260701000001_add_kb_chunks/migration.sql"),
  "utf-8"
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

function splitStatements(sql) {
  const statements = [];
  let current = "";
  let inDollarString = false;
  let dollarTag = "";
  let i = 0;

  while (i < sql.length) {
    if (!inDollarString) {
      const dollarMatch = sql.slice(i).match(/^\$([a-z_]*)\$/);
      if (dollarMatch) {
        inDollarString = true;
        dollarTag = dollarMatch[1];
        current += dollarMatch[0];
        i += dollarMatch[0].length;
        continue;
      }

      if (sql[i] === ";") {
        const trimmed = current.trim();
        if (trimmed.length > 0 && !trimmed.startsWith("--")) {
          statements.push(trimmed);
        }
        current = "";
        i++;
        continue;
      }
    } else {
      const endTag = "$" + dollarTag + "$";
      if (sql.slice(i, i + endTag.length) === endTag) {
        inDollarString = false;
        dollarTag = "";
        current += endTag;
        i += endTag.length;
        continue;
      }
    }

    current += sql[i];
    i++;
  }

  const trimmed = current.trim();
  if (trimmed.length > 0 && !trimmed.startsWith("--")) {
    statements.push(trimmed);
  }

  return statements;
}

async function main() {
  const statements = splitStatements(migrationSql).filter(
    (s) => s.length > 0 && !s.startsWith("--")
  );

  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 100);
    console.log(`Running: ${preview}...`);
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e) {
      console.error(`Error running: ${preview}`);
      console.error(e.message?.slice(0, 200));
      throw e;
    }
  }

  console.log("Migration complete!");

  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  console.log("Tables now:", JSON.stringify(tables, null, 2));

  const func = await prisma.$queryRawUnsafe(
    "SELECT proname FROM pg_proc WHERE proname='match_kb_chunks'"
  );
  console.log("Function exists:", func.length > 0);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
