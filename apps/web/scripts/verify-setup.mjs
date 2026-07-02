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
  console.log("=== Tables ===");
  const tables = await prisma.$queryRawUnsafe(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  console.log(JSON.stringify(tables, null, 2));

  console.log("\n=== kb_chunks columns ===");
  const cols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name='kb_chunks' ORDER BY ordinal_position"
  );
  console.log(JSON.stringify(cols, null, 2));

  console.log("\n=== match_kb_chunks function ===");
  const func = await prisma.$queryRawUnsafe(
    "SELECT proname, prosrc FROM pg_proc WHERE proname='match_kb_chunks'"
  );
  console.log(JSON.stringify(func, null, 2));

  console.log("\n=== Indexes on kb_chunks ===");
  const indexes = await prisma.$queryRawUnsafe(
    "SELECT indexname, indexdef FROM pg_indexes WHERE tablename='kb_chunks'"
  );
  console.log(JSON.stringify(indexes, null, 2));

  console.log("\n=== Vector extension ===");
  const ext = await prisma.$queryRawUnsafe(
    "SELECT * FROM pg_extension WHERE extname='vector'"
  );
  console.log(JSON.stringify(ext, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
