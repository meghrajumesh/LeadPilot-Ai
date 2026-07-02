import { NextResponse } from "next/server";
import { corsHeaders, fail } from "@/lib/api-response";
import { ingestDocument } from "@/lib/rag-supabase";
import { createClient } from "@/lib/supabase/server";
import { getSharedPrismaClient } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Unauthorized", 401);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) return fail("file is required");
    if (!projectId) return fail("projectId is required");

    const prisma = getSharedPrismaClient();
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      select: { workspaceId: true },
    });
    if (!membership) return fail("No workspace found", 404);

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId: membership.workspaceId },
      select: { id: true },
    });
    if (!project) return fail("Project not found or access denied", 403);

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (file.name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text.trim()) return fail("No readable text found in file");

    const title = file.name.replace(/\.[^.]+$/, "");
    const docId = `file-${crypto.randomUUID()}`;
    const chunksAdded = await ingestDocument(projectId, docId, title, text, file.name);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docId,
          title,
          chunkCount: chunksAdded,
        },
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    logger.error(error);
    return fail("Unable to upload document", 500);
  }
}
