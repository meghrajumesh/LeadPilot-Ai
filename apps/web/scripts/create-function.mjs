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
  const cols = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name='kb_chunks' ORDER BY ordinal_position"
  );
  console.log("kb_chunks columns:", JSON.stringify(cols, null, 2));

  const funcSql = `
CREATE OR REPLACE FUNCTION match_kb_chunks(
    query_embedding vector(768),
    match_project_id TEXT,
    match_count INT DEFAULT 5
)
RETURNS TABLE (id BIGINT, content TEXT, source_ref TEXT, similarity FLOAT)
LANGUAGE sql STABLE
AS $$
    SELECT kb_chunks.id, kb_chunks.content, kb_chunks.source_ref,
           1 - (kb_chunks.embedding <=> query_embedding) AS similarity
    FROM kb_chunks
    WHERE kb_chunks.project_id = match_project_id
    ORDER BY kb_chunks.embedding <=> query_embedding
    LIMIT match_count;
$$;
`;

  await prisma.$executeRawUnsafe(funcSql);
  console.log("Function created");

  const func = await prisma.$queryRawUnsafe(
    "SELECT proname FROM pg_proc WHERE proname='match_kb_chunks'"
  );
  console.log("Function exists:", func.length > 0);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
