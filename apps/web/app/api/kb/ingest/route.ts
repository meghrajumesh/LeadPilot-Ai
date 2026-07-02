import { NextResponse } from "next/server";
import { z } from "zod";
import { corsHeaders, fail } from "@/lib/api-response";
import { createClient } from "@/lib/supabase/server";
import { getSharedPrismaClient } from "@/lib/prisma";
import { ingestDocument } from "@/lib/rag-supabase";
import { logger } from "@/lib/logger";

const bodySchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  title: z.string().max(500).default(""),
  content: z.string().min(1).optional(),
  url: z.string().url().optional(),
  source: z.enum(["text", "website", "file"]).default("text"),
  sourceRef: z.string().nullable().optional(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

async function fetchUrlText(url: string): Promise<{ title: string; content: string }> {
  let lastErr: Error | null = null;
  const userAgents = [
    BROWSER_HEADERS["User-Agent"],
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  ];

  for (const ua of userAgents) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { ...BROWSER_HEADERS, "User-Agent": ua },
        redirect: "follow",
      });
      if (res.ok) {
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
        return { title, content: body.slice(0, 50000) };
      }
      // 403 with Cloudflare/security — try next UA
      if (res.status === 403) {
        lastErr = new Error(`Website blocked the request (403). Try adding the content manually via Text or File upload instead.`);
        continue;
      }
      throw new Error(`Failed to fetch URL (${res.status})`);
    } catch (e: any) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (e?.name === "AbortError") continue;
      throw new Error(`Failed to reach URL: ${e?.message ?? "Unknown error"}`);
    }
  }
  throw lastErr ?? new Error("Failed to fetch URL");
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return fail("You must be signed in to ingest knowledge.", 401);
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid request", 400);
    }

    let { projectId, title, content, source, sourceRef, url } = parsed.data;

    if (source === "website" && url && !content) {
      try {
        const fetched = await fetchUrlText(url);
        title = title || fetched.title;
        content = fetched.content;
        sourceRef = sourceRef || url;
      } catch (e) {
        return fail(e instanceof Error ? e.message : "Failed to fetch URL", 400);
      }
    }

    if (!content) {
      return fail("content is required", 400);
    }

    const prisma = getSharedPrismaClient();
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      select: { workspaceId: true },
    });

    if (!membership) {
      return fail("No workspace found for user.", 404);
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: membership.workspaceId },
      select: { id: true },
    });

    if (!project) {
      return fail("Project not found or access denied.", 403);
    }

    const docId = `${source}-${crypto.randomUUID()}`;
    const chunksAdded = await ingestDocument(
      projectId,
      docId,
      title,
      content!,
      sourceRef ?? title
    );

    return NextResponse.json(
      { success: true, chunksAdded, docId },
      { headers: corsHeaders() }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`[ingest] ${msg}`);
    return fail(msg.slice(0, 300), 500);
  }
}
