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

  const widgetConfig = project.widgetConfig as Record<string, unknown> | null;
  const userName = membership.user.name ?? user.email?.split("@")[0] ?? "Owner";

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
          initialConfig={{
            color: (widgetConfig?.color as string) ?? "#2563eb",
            botName: (widgetConfig?.botName as string) ?? "LeadPilot",
            welcomeMessage: (widgetConfig?.welcomeMessage as string) ?? "Hi! How can I help you today?",
            avatarUrl: (widgetConfig?.avatarUrl as string) ?? ""
          }}
          initialDomains={project.allowedDomains}
        />
      </div>
    </DashboardLayout>
  );
}
