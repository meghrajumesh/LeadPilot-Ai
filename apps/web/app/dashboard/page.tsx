import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { LiveConversations } from "@/components/dashboard/live-conversations";
import { LiveStats } from "@/components/dashboard/live-stats";
import { RecentLeads } from "@/components/dashboard/recent-leads";
import { SourcesChart } from "@/components/dashboard/sources-chart";
import { getDashboardStats, getLeadsOverTime, getLiveConversations, getRecentLeads, getTopSources, getUserData } from "@/lib/dashboard-data";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDateRange() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(weekAgo)} - ${fmt(now)}`;
}

export default async function DashboardPage() {
  let userName = "John";
  let workspaceName = "Demo Workspace";

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const data = await getUserData(user.id);
    if (data) {
      userName = data.userName;
      workspaceName = data.workspaceName;
    }
  } catch {}

  const [leads, sources, recent, live] = await Promise.all([
    getLeadsOverTime(),
    getTopSources(),
    getRecentLeads(),
    getLiveConversations(),
  ]);

  const serverStats = await getDashboardStats().then((s) => ({
    conversations: s.find((x) => x.label === "Conversations")?.value as number ?? 0,
    leads: s.find((x) => x.label === "Total Leads")?.value as number ?? 0,
    meetingsBooked: s.find((x) => x.label === "Meetings Booked")?.value as number ?? 0,
    conversionRate: ((s.find((x) => x.label === "Conversion Rate")?.value ?? "0%") as string).replace("%", ""),
  }));

  return (
    <DashboardLayout userName={userName} workspaceName={workspaceName}>
      <div className="space-y-6">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-text-primary">Good morning, {userName}! 👋</h1>
            <p className="mt-2 text-text-secondary">Here&rsquo;s what&rsquo;s happening with your leads today.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-text-secondary shadow-sm">
            <Calendar className="h-4 w-4 text-text-secondary" />
            {formatDateRange()}
            <ChevronDown className="h-3 w-3" />
          </div>
        </section>

        <LiveStats serverStats={serverStats} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <LeadsChart data={leads} />
          <SourcesChart data={sources} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <RecentLeads data={recent} />
          <LiveConversations data={live} />
        </section>
      </div>
    </DashboardLayout>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
