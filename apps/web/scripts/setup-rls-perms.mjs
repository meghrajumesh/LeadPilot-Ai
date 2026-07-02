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
  // Grant function execution to anon (for public chat endpoint)
  await prisma.$executeRawUnsafe(
    "GRANT EXECUTE ON FUNCTION match_kb_chunks(vector(768), TEXT, INT) TO anon, authenticated;"
  );
  console.log("Function permissions granted");

  // Grant SELECT on kb_chunks to anon/authenticated (needed for function to work)
  await prisma.$executeRawUnsafe(
    "GRANT SELECT ON kb_chunks TO anon, authenticated;"
  );
  console.log("SELECT permissions granted on kb_chunks");

  // Grant INSERT/UPDATE/DELETE to service_role only (handled by server-side code)
  // (service_role has all permissions by default in Supabase)

  console.log("Permissions setup complete!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
