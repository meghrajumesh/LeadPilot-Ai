import { NextResponse } from "next/server";
import { z } from "zod";
import { getSharedPrismaClient } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";

const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(120),
  siteUrl: z.string().trim().url("Enter a valid site URL.")
});

function generateWidgetKey(): string {
  return "wgt_" + randomBytes(16).toString("hex");
}

async function getUserAndMembership() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null as typeof user, membership: null, error: "You must be signed in." };
  }

  const prisma = getSharedPrismaClient();
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true }
  });

  if (!membership) {
    return { user, membership: null, error: "Create a workspace first." };
  }

  return { user, membership, error: null };
}

export async function GET() {
  const { error, membership } = await getUserAndMembership();
  if (error || !membership) {
    return NextResponse.json({ success: false, error }, { status: 401 });
  }

  const prisma = getSharedPrismaClient();
  const projects = await prisma.project.findMany({
    where: { workspaceId: membership.workspaceId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, siteUrl: true }
  });

  return NextResponse.json({ success: true, data: { projects } });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ success: false, error: "You must be signed in to create a project." }, { status: 401 });
  }

  const parsed = createProjectSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid project." }, { status: 400 });
  }

  const prisma = getSharedPrismaClient();
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true }
  });

  if (!membership) {
    return NextResponse.json({ success: false, error: "Create a workspace before adding projects." }, { status: 404 });
  }

  const project = await prisma.project.create({
    data: {
      workspaceId: membership.workspaceId,
      name: parsed.data.name,
      siteUrl: parsed.data.siteUrl,
      widgetKey: generateWidgetKey()
    }
  });

  return NextResponse.json({ success: true, data: { project } });
}
