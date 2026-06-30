type StoredChunk = {
  id: string;
  docId: string;
  content: string;
  vector: number[];
};

export type DocSource = "seed" | "text" | "website" | "file";

export type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
  source: DocSource;
  url?: string;
  filename?: string;
  chunkCount: number;
  createdAt: string;
};

type InternalDoc = {
  id: string;
  title: string;
  content: string;
  source: DocSource;
  url?: string;
  filename?: string;
  createdAt: string;
};

const SEED_DOCS: InternalDoc[] = [
  {
    id: "seed-company", title: "Company Overview", source: "seed", createdAt: new Date(0).toISOString(),
    content: `Vedhas Technology and Solutions is a software and IT services company that helps businesses build, modernize, and scale their digital products. We work with startups and established companies to turn ideas into reliable, well-designed software.`,
  },
  {
    id: "seed-services", title: "Services", source: "seed", createdAt: new Date(0).toISOString(),
    content: `Custom Software Development — web apps, internal tools, and SaaS platforms (React, Next.js, Node.js, Python). Mobile App Development — native and cross-platform apps for iOS and Android. Cloud & DevOps — cloud migration, infrastructure setup, and CI/CD pipelines (AWS, Azure, Google Cloud). AI & Automation — chatbots, workflow automation, and AI features in existing products. UI/UX Design — product design, prototyping, and design systems. Maintenance & Support — ongoing support, bug fixes, and feature updates.`,
  },
  {
    id: "seed-why-us", title: "Why Us / Key Features", source: "seed", createdAt: new Date(0).toISOString(),
    content: `Dedicated project team with a single point of contact. Transparent weekly progress updates and demos. Fixed-scope and dedicated-team engagement models. Post-launch support included on all builds.`,
  },
  {
    id: "seed-pricing", title: "Engagement Models & Pricing", source: "seed", createdAt: new Date(0).toISOString(),
    content: `Project-based: fixed scope and fixed quote after a free discovery call. Dedicated team: monthly retainer for an ongoing team. Exact pricing depends on scope; a tailored quote is shared after a discovery call. Do not quote fixed prices over chat.`,
  },
  {
    id: "seed-process", title: "Process", source: "seed", createdAt: new Date(0).toISOString(),
    content: `Discovery call → proposal & quote → design → development in sprints → testing → launch → support.`,
  },
  {
    id: "seed-contact", title: "Contact & Next Steps", source: "seed", createdAt: new Date(0).toISOString(),
    content: `Book a free 30-minute discovery call, or leave name, email, and a short project note; the team replies within one business day. Email: hello@vedhastech.com. Hours: Mon–Fri, 9 AM – 6 PM IST.`,
  },
];

let chunks: StoredChunk[] = [];
let userDocs: InternalDoc[] = [];
let ready = false;
let initLock: Promise<void> | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function splitIntoChunks(text: string): string[] {
  const parts = text.split(/\n{2,}/);
  const result: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length < 30) continue;
    if (trimmed.length <= 600) {
      result.push(trimmed);
    } else {
      const sentences = trimmed.match(/[^.!?\n]+[.!?]*/g) ?? [trimmed];
      let buf = "";
      for (const s of sentences) {
        if (buf.length + s.length > 600 && buf.length > 0) {
          result.push(buf.trim());
          buf = s;
        } else {
          buf += (buf ? " " : "") + s;
        }
      }
      if (buf.trim()) result.push(buf.trim());
    }
  }
  return result;
}

async function embed(text: string): Promise<number[]> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.embedContent({
    model: "embedding-001",
    contents: [{ role: "user", parts: [{ text }] }],
  });
  return res.embeddings?.[0]?.values ?? [];
}

async function initStore() {
  try {
    for (const doc of SEED_DOCS) {
      const pieces = splitIntoChunks(doc.content);
      for (const piece of pieces) {
        const vector = await embed(piece);
        chunks.push({ id: crypto.randomUUID(), docId: doc.id, content: piece, vector });
      }
    }
  } catch (e) {
    console.error("RAG init failed, continuing without RAG:", e);
  }
  ready = true;
}

async function ensureReady() {
  if (ready) return;
  if (!initLock) initLock = initStore();
  await initLock;
}

function toKnowledgeDoc(d: InternalDoc, chunkCount: number): KnowledgeDoc {
  return { ...d, chunkCount };
}

export async function retrieve(
  query: string, topK = 3
): Promise<{ content: string; score: number }[]> {
  await ensureReady();
  const qVec = await embed(query);
  const scored = chunks
    .map((c) => ({ content: c.content, score: cosineSimilarity(qVec, c.vector) }))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((r) => r.score > 0.25);
}

export async function addTextDocument(title: string, content: string): Promise<KnowledgeDoc> {
  await ensureReady();
  const doc: InternalDoc = {
    id: `user-${crypto.randomUUID()}`,
    title,
    content,
    source: "text",
    createdAt: new Date().toISOString(),
  };
  const pieces = splitIntoChunks(content);
  const newChunks: StoredChunk[] = [];
  for (const piece of pieces) {
    const vector = await embed(piece);
    newChunks.push({ id: crypto.randomUUID(), docId: doc.id, content: piece, vector });
  }
  chunks.push(...newChunks);
  userDocs.push(doc);
  return toKnowledgeDoc(doc, pieces.length);
}

export async function addWebsiteDocument(url: string): Promise<KnowledgeDoc> {
  await ensureReady();
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Failed to fetch URL (${res.status}): ${res.statusText}`);
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname;
  const body = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const content = body.slice(0, 50000);
  const doc: InternalDoc = {
    id: `user-${crypto.randomUUID()}`,
    title,
    content,
    source: "website",
    url,
    createdAt: new Date().toISOString(),
  };
  const pieces = splitIntoChunks(content);
  const newChunks: StoredChunk[] = [];
  for (const piece of pieces) {
    const vector = await embed(piece);
    newChunks.push({ id: crypto.randomUUID(), docId: doc.id, content: piece, vector });
  }
  chunks.push(...newChunks);
  userDocs.push(doc);
  return toKnowledgeDoc(doc, pieces.length);
}

export async function addFileDocument(filename: string, content: string): Promise<KnowledgeDoc> {
  await ensureReady();
  const doc: InternalDoc = {
    id: `user-${crypto.randomUUID()}`,
    title: filename.replace(/\.[^.]+$/, ""),
    content,
    source: "file",
    filename,
    createdAt: new Date().toISOString(),
  };
  const pieces = splitIntoChunks(content);
  const newChunks: StoredChunk[] = [];
  for (const piece of pieces) {
    const vector = await embed(piece);
    newChunks.push({ id: crypto.randomUUID(), docId: doc.id, content: piece, vector });
  }
  chunks.push(...newChunks);
  userDocs.push(doc);
  return toKnowledgeDoc(doc, pieces.length);
}

export async function deleteDocument(id: string): Promise<boolean> {
  await ensureReady();
  const idx = userDocs.findIndex((d) => d.id === id);
  if (idx === -1) return false;
  userDocs.splice(idx, 1);
  chunks = chunks.filter((c) => c.docId !== id);
  return true;
}

export function listDocuments(): KnowledgeDoc[] {
  const seed = SEED_DOCS.map((d) =>
    toKnowledgeDoc(d, chunks.filter((c) => c.docId === d.id).length)
  );
  const user = userDocs.map((d) =>
    toKnowledgeDoc(d, chunks.filter((c) => c.docId === d.id).length)
  );
  return [...seed, ...user];
}
