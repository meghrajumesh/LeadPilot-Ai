import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getSharedPrismaClient } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { WidgetSettingsForm } from "./widget-settings-form";

export const dynamic = "force-dynamic";

export default async function WidgetCustomizationPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/projects/${params.id}/widget`);
  }

  const prisma = getSharedPrismaClient();
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: { select: { name: true } }, user: { select: { name: true, email: true } } }
  });

  if (!membership) {
    redirect("/signup");
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, workspaceId: membership.workspaceId },
    select: { id: true, name: true, widgetConfig: true, allowedDomains: true }
  });

  if (!project) {
    notFound();
  }

  const wc = project.widgetConfig as Record<string, unknown> | null;
  const userName = membership.user.name ?? user.email?.split("@")[0] ?? "Owner";

  const initialSettings = {
    color: (wc?.color as string) ?? "#2563eb",
    botName: (wc?.botName as string) ?? "LeadPilot",
    welcomeMessage: (wc?.welcomeMessage as string) ?? "Hi! How can I help you today?",
    avatarUrl: (wc?.avatarUrl as string) ?? "",
    textColor: (wc?.textColor as string) ?? "#ffffff",
    backgroundColor: (wc?.backgroundColor as string) ?? "#ffffff",
    position: (wc?.position as string) ?? "bottom-right",
    launcherShape: (wc?.launcherShape as string) ?? "round",
    launcherIcon: (wc?.launcherIcon as string) ?? "",
    headerTitle: (wc?.headerTitle as string) ?? "Chat with us",
    cornerRadius: (wc?.cornerRadius as number) ?? 18,
    sizePreset: (wc?.sizePreset as string) ?? "M",
    showBranding: (wc?.showBranding as boolean) ?? true,
    fontFamily: (wc?.fontFamily as string) ?? "Inter",
    layout: (wc?.layout as string) ?? "bubble",
    voiceEnabled: (wc?.voiceEnabled as boolean) ?? true
  };

  return (
    <DashboardLayout userName={userName} workspaceName={membership.workspace.name}>
      <Link className="text-sm font-semibold text-[#7C3AED]" href={`/projects/${project.id}`}>
        ← Back to project
      </Link>
      <div className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Widget Settings</h1>
        <p className="mt-2 text-[#6B7280]">Customize the chat widget appearance and security for {project.name}.</p>
      </div>
      <div className="mt-6">
        <WidgetSettingsForm
          projectId={project.id}
          initialSettings={initialSettings}
          initialDomains={project.allowedDomains}
        />
      </div>
    </DashboardLayout>
  );
}
