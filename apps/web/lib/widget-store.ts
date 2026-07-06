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
  textColor?: string;
  backgroundColor?: string;
  position?: string;
  launcherShape?: string;
  launcherIcon?: string;
  headerTitle?: string;
  cornerRadius?: number;
  sizePreset?: string;
  showBranding?: boolean;
  fontFamily?: string;
  layout?: string;
  voiceEnabled?: boolean;
  callEnabled?: boolean;
  quickActions?: { label: string; icon: string; action: string; value: string }[];
};

const DEFAULT_WIDGET_COLOR = "#2563eb";
const DEFAULT_TEXT_COLOR = "#ffffff";
const DEFAULT_BG_COLOR = "#ffffff";
const DEFAULT_POSITION = "bottom-right";
const DEFAULT_LAUNCHER_SHAPE = "round";
const DEFAULT_HEADER_TITLE = "Chat with us";
const DEFAULT_CORNER_RADIUS = 18;
const DEFAULT_SIZE_PRESET = "M";
const DEFAULT_SHOW_BRANDING = true;
const DEFAULT_FONT_FAMILY = "Inter";
const DEFAULT_LAYOUT = "bubble";
const DEFAULT_VOICE_ENABLED = true;
const DEFAULT_CALL_ENABLED = true;
const DEFAULT_QUICK_ACTIONS = [
  { label: "Speak to Sales", icon: "headset", action: "sendMessage", value: "I'd like to speak to sales" },
  { label: "Book a Demo", icon: "calendar", action: "link", value: "https://example.com/demo" },
];

const demoProject: StoredProject = {
  id: "demo-project",
  name: "Acme Services",
  clientId: "demo-client-id",
  widgetKey: "wgt_demo",
  allowedDomains: [],
  widgetConfig: {
    color: DEFAULT_WIDGET_COLOR,
    botName: "Ava",
    welcomeMessage: "Hi! I can help you choose the right service.",
    textColor: DEFAULT_TEXT_COLOR,
    backgroundColor: DEFAULT_BG_COLOR,
    position: DEFAULT_POSITION,
    launcherShape: DEFAULT_LAUNCHER_SHAPE,
    headerTitle: DEFAULT_HEADER_TITLE,
    cornerRadius: DEFAULT_CORNER_RADIUS,
    sizePreset: DEFAULT_SIZE_PRESET,
    showBranding: DEFAULT_SHOW_BRANDING,
    fontFamily: DEFAULT_FONT_FAMILY,
    layout: DEFAULT_LAYOUT,
    voiceEnabled: DEFAULT_VOICE_ENABLED,
    callEnabled: DEFAULT_CALL_ENABLED,
    quickActions: DEFAULT_QUICK_ACTIONS
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
    color: config.color ?? DEFAULT_WIDGET_COLOR,
    botName: config.botName ?? "LeadPilot",
    welcomeMessage: config.welcomeMessage ?? "Hi! How can I help you today?",
    avatarUrl: config.avatarUrl,
    textColor: config.textColor ?? DEFAULT_TEXT_COLOR,
    backgroundColor: config.backgroundColor ?? DEFAULT_BG_COLOR,
    position: (config.position as WidgetConfig["position"]) ?? DEFAULT_POSITION,
    launcherShape: (config.launcherShape as WidgetConfig["launcherShape"]) ?? DEFAULT_LAUNCHER_SHAPE,
    launcherIcon: config.launcherIcon ?? "",
    headerTitle: config.headerTitle ?? DEFAULT_HEADER_TITLE,
    cornerRadius: config.cornerRadius ?? DEFAULT_CORNER_RADIUS,
    sizePreset: (config.sizePreset as WidgetConfig["sizePreset"]) ?? DEFAULT_SIZE_PRESET,
    showBranding: config.showBranding ?? DEFAULT_SHOW_BRANDING,
    fontFamily: config.fontFamily ?? DEFAULT_FONT_FAMILY,
    layout: (config.layout as WidgetConfig["layout"]) ?? DEFAULT_LAYOUT,
    voiceEnabled: config.voiceEnabled ?? DEFAULT_VOICE_ENABLED,
    callEnabled: config.callEnabled ?? DEFAULT_CALL_ENABLED,
    quickActions: (config.quickActions ?? DEFAULT_QUICK_ACTIONS) as WidgetConfig["quickActions"],
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
