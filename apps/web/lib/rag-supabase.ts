import { getSharedPrismaClient } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const geminiApiKey = process.env.GEMINI_API_KEY!;

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const BATCH_SIZE = 10;
const MAX_RETRIES = 5;

const GEMINI_BASE = "https://generativelanguage.googleapis.com";

async function discoverEmbedModel(): Promise<string> {
  const versions = ["v1beta", "v1"];
  const modelsToTry = ["gemini-embedding-001", "gemini-embedding-2", "gemini-embedding-2-preview", "text-embedding-004"];
  for (const version of versions) {
    for (const model of modelsToTry) {
      const url = `${GEMINI_BASE}/${version}/models/${model}:embedContent`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiApiKey },
          body: JSON.stringify({ content: { parts: [{ text: "test" }] }, taskType: "RETRIEVAL_DOCUMENT" }),
        });
        if (res.ok) return url;
      } catch {}
    }
  }
  throw new Error(
    "No embedding model available. Check that your GEMINI_API_KEY is valid and the Generative Language API is enabled in Google Cloud Console."
  );
}

let _embedUrl: string | null = null;
async function getEmbedUrl(): Promise<string> {
  if (!_embedUrl) _embedUrl = await discoverEmbedModel();
  return _embedUrl;
}

export function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) {
    return text.trim().length >= 30 ? [text.trim()] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const lookback = text.slice(end - 50, end);
      const breakMatch = lookback.match(/[.!?\n](?:\s|$)/);
      if (breakMatch) {
        end = end - 50 + breakMatch.index! + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = Math.max(end - CHUNK_OVERLAP, start + 1);

    if (start >= text.length) break;
  }

  return chunks.filter((c) => c.length >= 30);
}

async function callEmbed(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[]> {
  const url = await getEmbedUrl();
  const body: Record<string, any> = {
    content: { parts: [{ text }] },
    taskType,
    outputDimensionality: 768,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": geminiApiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    _embedUrl = null;
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini embed error (${res.status}): ${err.slice(0, 300)}`);
  }
  const json = await res.json();
  return json?.embedding?.values ?? [];
}

export async function embedText(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[]> {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      return await callEmbed(text, taskType);
    } catch (error: any) {
      attempt++;
      if (error?.message?.includes("429") && attempt < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
  return [];
}

export async function embedBatch(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    for (const t of batch) {
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          const emb = await callEmbed(t, taskType);
          results.push(emb);
          break;
        } catch (error: any) {
          attempt++;
          const isQuota = error?.message?.includes("429");
          if (isQuota && attempt < MAX_RETRIES) {
            const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
            await new Promise((r) => setTimeout(r, delay));
          } else {
            logger.error(`[embedBatch] attempt ${attempt} failed: ${error?.message?.slice(0, 200)}`);
            throw error;
          }
        }
      }
    }
  }

  return results;
}

function embeddingToSql(embedding: number[]): string {
  return "[" + embedding.join(",") + "]";
}

export async function ingestDocument(
  projectId: string,
  docId: string,
  title: string,
  content: string,
  sourceRef: string | null
): Promise<number> {
  const chunks = chunkText(content);
  if (chunks.length === 0) return 0;

  const embeddings = await embedBatch(chunks, "RETRIEVAL_DOCUMENT");
  const prisma = getSharedPrismaClient();

  for (let i = 0; i < chunks.length; i++) {
    const embeddingSql = embeddingToSql(embeddings[i]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO kb_chunks (project_id, doc_id, content, source_ref, embedding) VALUES ($1, $2, $3, $4, $5::vector)`,
      projectId,
      docId,
      chunks[i],
      sourceRef ?? title,
      embeddingSql
    );
  }

  return chunks.length;
}

export async function retrieve(
  projectId: string,
  query: string,
  topK = 5
): Promise<{ content: string; source_ref: string; similarity: number }[]> {
  const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");
  const embeddingSql = embeddingToSql(queryEmbedding);

  const prisma = getSharedPrismaClient();
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT id, content, source_ref,
              1 - (embedding <=> $1::vector) AS similarity
       FROM kb_chunks
       WHERE project_id = $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      embeddingSql,
      projectId,
      topK
    )) as { id: bigint; content: string; source_ref: string | null; similarity: number }[];

    return rows.map((r) => ({
      content: r.content,
      source_ref: r.source_ref ?? "",
      similarity: Number(r.similarity),
    }));
  } catch (error) {
    logger.error(`[retrieve] query error: ${error}`);
    return [];
  }
}

type DocRow = { doc_id: string; source_ref: string | null; created_at: Date };
type CountRow = { doc_id: string; cnt: bigint };

export async function listDocuments(projectId: string): Promise<
  { id: string; title: string; source: string; source_ref: string; chunkCount: number; createdAt: string }[]
> {
  const prisma = getSharedPrismaClient();
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT doc_id, source_ref, MIN(created_at) AS created_at
       FROM kb_chunks
       WHERE project_id = $1
       GROUP BY doc_id, source_ref
       ORDER BY MIN(created_at) DESC`,
      projectId
    )) as DocRow[];

    const countRows = (await prisma.$queryRawUnsafe(
      `SELECT doc_id, COUNT(*)::bigint AS cnt
       FROM kb_chunks
       WHERE project_id = $1
       GROUP BY doc_id`,
      projectId
    )) as CountRow[];

    const countMap = new Map<string, number>();
    for (const r of countRows) {
      countMap.set(r.doc_id, Number(r.cnt));
    }

    return rows.map((row) => ({
      id: row.doc_id,
      title: row.source_ref ?? "",
      source: "custom",
      source_ref: row.source_ref ?? "",
      chunkCount: countMap.get(row.doc_id) ?? 0,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    logger.error(`[listDocuments] ${error}`);
    return [];
  }
}

export async function deleteDocument(projectId: string, docId: string): Promise<boolean> {
  const prisma = getSharedPrismaClient();
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM kb_chunks WHERE project_id = $1 AND doc_id = $2`,
      projectId,
      docId
    );
    return true;
  } catch (error) {
    logger.error(`[deleteDocument] ${error}`);
    return false;
  }
}
