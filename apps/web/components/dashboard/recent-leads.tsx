import Link from "next/link";

const statusStyle: Record<string, { bg: string; text: string }> = {
  New: { bg: "#EEF0FE", text: "#6366F1" },
  Contacted: { bg: "#DCFCE7", text: "#16A34A" },
  Qualified: { bg: "#DBEAFE", text: "#2563EB" }
};

export function RecentLeads({ data }: { data?: { name: string; email: string; source: string; time: string; status: "New" | "Contacted" | "Qualified" }[] }) {
  const rows = data ?? [];
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <h2 className="text-base font-semibold text-text-primary">Recent Leads</h2>
      {rows.length > 0 ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs text-text-secondary">
              <tr className="border-b border-border">
                <th className="py-3 font-medium">Name</th>
                <th className="py-3 font-medium">Email</th>
                <th className="py-3 font-medium">Source</th>
                <th className="py-3 font-medium">Contacted</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr className="border-b border-border last:border-b-0" key={lead.email}>
                  <td className="py-4 font-medium text-text-primary">{lead.name}</td>
                  <td className="py-4 text-text-secondary">{lead.email}</td>
                  <td className="py-4 text-text-primary">{lead.source}</td>
                  <td className="py-4 text-text-secondary">{lead.time}</td>
                  <td className="py-4">
                    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: statusStyle[lead.status].bg, color: statusStyle[lead.status].text }}>{lead.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 text-sm text-text-secondary">No leads yet</p>
      )}
      <Link className="mt-5 inline-flex text-sm font-semibold text-brand" href="/leads">
        View all leads →
      </Link>
    </section>
  );
}
