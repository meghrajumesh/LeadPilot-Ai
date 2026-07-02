import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  console.log("Tables:", JSON.stringify(tables, null, 2));

  const ext = await prisma.$queryRawUnsafe(
    "SELECT * FROM pg_extension WHERE extname='vector'"
  );
  console.log("Vector ext:", JSON.stringify(ext, null, 2));

  try {
    const columns = await prisma.$queryRawUnsafe(
      "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name='kb_chunks' ORDER BY ordinal_position"
    );
    console.log("kb_chunks columns:", JSON.stringify(columns, null, 2));
  } catch {
    console.log("kb_chunks table does not exist");
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
