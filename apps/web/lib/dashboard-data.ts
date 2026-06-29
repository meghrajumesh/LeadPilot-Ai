import { getSharedPrismaClient } from "./prisma";

function zeroStats() {
  return [
    { label: "Total Leads", value: 0, change: 0, period: "vs last 7 days" },
    { label: "Conversations", value: 0, change: 0, period: "vs last 7 days" },
    { label: "Meetings Booked", value: 0, change: 0, period: "vs last 7 days" },
    { label: "Conversion Rate", value: "0.00%", change: 0, period: "vs last 7 days" },
  ];
}

export async function getDashboardStats() {
  try {
    const prisma = getSharedPrismaClient();
    const [totalLeads, totalConversations, meetingsBooked] = await Promise.all([
      prisma.lead.count(),
      prisma.conversation.count(),
      prisma.lead.count({ where: { status: { in: ["QUALIFIED", "WON"] } } }),
    ]);
    if (totalLeads === 0 && totalConversations === 0) return zeroStats();
    const convRate = totalConversations > 0 ? (totalLeads / totalConversations) * 100 : 0;
    return [
      { label: "Total Leads", value: totalLeads, change: 0, period: "vs last 7 days" },
      { label: "Conversations", value: totalConversations, change: 0, period: "vs last 7 days" },
      { label: "Meetings Booked", value: meetingsBooked, change: 0, period: "vs last 7 days" },
      { label: "Conversion Rate", value: `${convRate.toFixed(2)}%`, change: 0, period: "vs last 7 days" },
    ];
  } catch { return zeroStats(); }
}

function getDateRange() {
  const today = new Date();
  const dayMap = new Map<string, number>();
  const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayMap.set(formatter.format(d), 0);
  }
  return { dayMap, formatter, today };
}

export async function getLeadsOverTime() {
  try {
    const prisma = getSharedPrismaClient();
    const { dayMap, formatter, today } = getDateRange();
    type LeadDate = { createdAt: Date };
    const dbLeads: LeadDate[] = await prisma.lead.findMany({ select: { createdAt: true }, orderBy: { createdAt: "asc" } }) as LeadDate[];
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    for (const l of dbLeads) {
      if (l.createdAt < sevenDaysAgo) continue;
      const d = formatter.format(l.createdAt);
      if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
    }
    return Array.from(dayMap.entries()).map(([date, leads]) => ({ date, leads }));
  } catch {
    const { dayMap } = getDateRange();
    return Array.from(dayMap.entries()).map(([date]) => ({ date, leads: 0 }));
  }
}

const sourceColors = ["#6366F1", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

type SourceGroup = { source: string | null; _count: number };

export async function getTopSources() {
  try {
    const prisma = getSharedPrismaClient();
    const totalLeads = await prisma.lead.count();
    if (totalLeads === 0) return [];
    const grouped = await prisma.lead.groupBy({ by: ["source"], _count: true }) as unknown as SourceGroup[];
    const withSource = grouped.filter((g: SourceGroup) => g.source !== null);
    if (withSource.length === 0) return [];
    return withSource
      .map((g: SourceGroup, i: number) => ({
        name: g.source!,
        value: Math.round((g._count / totalLeads) * 100),
        color: sourceColors[i % sourceColors.length],
      }))
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value);
  } catch { return []; }
}

export async function getRecentLeads() {
  try {
    const prisma = getSharedPrismaClient();
    type LeadRow = { name: string | null; email: string | null; status: string; createdAt: Date };
    const recent: LeadRow[] = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }) as LeadRow[];
    if (recent.length === 0) return [];
    return recent.map((l) => ({
      name: l.name ?? "Unknown",
      email: l.email ?? "unknown@email.com",
      source: "Website Chat",
      time: timeAgo(l.createdAt),
      status: l.status.charAt(0) + l.status.slice(1).toLowerCase() as "New" | "Contacted" | "Qualified",
    }));
  } catch { return []; }
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

export async function getLiveConversations() {
  try {
    const prisma = getSharedPrismaClient();
    const conversations = await prisma.conversation.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        project: { select: { name: true } },
      },
    });
    if (conversations.length === 0) return [];
    return conversations.map((c: { project: { name: string }; messages: { content: string }[]; createdAt: Date }) => ({
      visitor: `Visitor on ${c.project.name}`,
      message: c.messages[0]?.content ?? "No messages",
      time: timeAgo(c.createdAt),
      online: true,
    }));
  } catch { return []; }
}

export async function getUserData(userId: string) {
  try {
    const prisma = getSharedPrismaClient();
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId },
      include: { workspace: { select: { name: true } }, user: { select: { name: true, email: true } } },
    });
    if (!membership) return null;
    return {
      userName: membership.user.name ?? "John",
      workspaceName: membership.workspace.name,
    };
  } catch { return null; }
}
