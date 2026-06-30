import type { WidgetConfig } from "@leadpilot/types";
import { getDatabaseUrl, getSharedPrismaClient } from "@/lib/prisma";

type StoredProject = {
  id: string;
  name: string;
  clientId: string;
  widgetConfig: unknown;
};

type WidgetConfigJson = {
  color?: string;
  botName?: string;
  welcomeMessage?: string;
  avatarUrl?: string;
};

const demoProject: StoredProject = {
  id: "demo-project",
  name: "Acme Services",
  clientId: "demo-client-id",
  widgetConfig: {
    color: "#2563eb",
    botName: "Ava",
    welcomeMessage: "Hi! I can help you choose the right service."
  }
};

function getPrisma() {
  if (!getDatabaseUrl()) {
    return null;
  }

  return getSharedPrismaClient();
}

function asWidgetConfigJson(value: unknown): WidgetConfigJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as WidgetConfigJson;
}

export function toWidgetConfig(project: StoredProject): WidgetConfig {
  const config = asWidgetConfigJson(project.widgetConfig);

  return {
    clientId: project.clientId,
    projectName: project.name,
    color: config.color ?? "#2563eb",
    botName: config.botName ?? "LeadPilot",
    welcomeMessage: config.welcomeMessage ?? "Hi! How can I help you today?",
    avatarUrl: config.avatarUrl
  };
}

export async function findProjectByClientId(_clientId: string) {
  try {
    const prisma = getPrisma();

    if (!prisma) {
      return demoProject;
    }

    const project = await prisma.project.findUnique({
      where: { clientId: _clientId },
      select: {
        id: true,
        name: true,
        clientId: true,
        widgetConfig: true
      }
    });

    return project ?? demoProject;
  } catch {
    return demoProject;
  }
}

export async function listProjects() {
  const prisma = getPrisma();

  if (!prisma) {
    return [demoProject];
  }

  return prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      siteUrl: true,
      clientId: true,
      widgetConfig: true
    }
  });
}
