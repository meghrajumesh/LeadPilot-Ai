import type { WidgetConfig } from "@leadpilot/types";
import { getDatabaseUrl, getSharedPrismaClient } from "@/lib/prisma";

type StoredProject = {
  id: string;
  name: string;
  clientId: string;
  widgetKey: string;
  allowedDomains: string[];
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
  widgetKey: "wgt_demo",
  allowedDomains: [],
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
    widgetKey: project.widgetKey,
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
        widgetKey: true,
        allowedDomains: true,
        widgetConfig: true
      }
    });
    return project ?? demoProject;
  } catch {
    return demoProject;
  }
}

export async function findProjectByWidgetKey(widgetKey: string) {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return demoProject;
    }
    const project = await prisma.project.findUnique({
      where: { widgetKey },
      select: {
        id: true,
        name: true,
        clientId: true,
        widgetKey: true,
        allowedDomains: true,
        widgetConfig: true
      }
    });
    return project ?? null;
  } catch {
    return null;
  }
}

export function isDomainAllowed(project: StoredProject, origin: string | null): { allowed: boolean; reason?: string } {
  if (!origin) {
    return { allowed: false, reason: "Missing Origin header" };
  }
  try {
    const hostname = new URL(origin).hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
      return { allowed: true };
    }
    if (!project.allowedDomains || project.allowedDomains.length === 0) {
      return { allowed: true };
    }
    const allowed = project.allowedDomains.some((d) => {
      const cleaned = d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
      return hostname === cleaned || hostname.endsWith("." + cleaned);
    });
    if (!allowed) {
      return { allowed: false, reason: "This widget is not allowed on this domain." };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "Invalid Origin header" };
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
      widgetKey: true,
      allowedDomains: true,
      widgetConfig: true
    }
  });
}
