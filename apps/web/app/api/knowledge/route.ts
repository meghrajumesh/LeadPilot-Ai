import { NextResponse } from "next/server";
import { corsHeaders, fail } from "@/lib/api-response";
import { listDocuments, deleteDocument } from "@/lib/rag-supabase";
import { createClient } from "@/lib/supabase/server";
import { getSharedPrismaClient } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Unauthorized", 401);

    if (!projectId) return fail("projectId query param is required");

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

    const docs = await listDocuments(projectId);
    return NextResponse.json({ success: true, data: docs }, { headers: corsHeaders() });
  } catch (error) {
    logger.error(error);
    return fail("Unable to list knowledge documents", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const docId = url.searchParams.get("id");
    if (!docId) return fail("id is required");
    if (!projectId) return fail("projectId is required");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Unauthorized", 401);

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

    await deleteDocument(projectId, docId);
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    logger.error(error);
    return fail("Unable to delete document", 500);
  }
}
