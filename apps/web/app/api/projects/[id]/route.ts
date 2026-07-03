import { NextResponse } from "next/server";
import { z } from "zod";
import { getSharedPrismaClient } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const updateProjectSchema = z.object({
  widgetConfig: z
    .object({
      color: z.string().optional(),
      botName: z.string().optional(),
      welcomeMessage: z.string().optional(),
      avatarUrl: z.string().optional(),
      textColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      position: z.string().optional(),
      launcherShape: z.string().optional(),
      launcherIcon: z.string().optional(),
      headerTitle: z.string().optional(),
      cornerRadius: z.number().optional(),
      sizePreset: z.string().optional(),
      showBranding: z.boolean().optional(),
      fontFamily: z.string().optional(),
      layout: z.string().optional(),
      voiceEnabled: z.boolean().optional()
    })
    .optional(),
  allowedDomains: z.array(z.string()).optional()
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const prisma = getSharedPrismaClient();
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true }
  });

  if (!membership) {
    return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, workspaceId: membership.workspaceId },
    select: { id: true }
  });

  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  const parsed = updateProjectSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.widgetConfig) {
    data.widgetConfig = parsed.data.widgetConfig;
  }

  if (parsed.data.allowedDomains !== undefined) {
    data.allowedDomains = parsed.data.allowedDomains.map((d) => d.trim()).filter(Boolean);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data,
    select: { id: true, widgetConfig: true, allowedDomains: true }
  });

  return NextResponse.json({ success: true, data: updated });
}
