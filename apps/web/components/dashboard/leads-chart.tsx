"use client";

import { Area, AreaChart, CartesianGrid, Dot, ResponsiveContainer, XAxis, YAxis } from "recharts";

export function LeadsChart({ data }: { data?: { date: string; leads: number }[] }) {
  const chartData = data ?? [];
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Leads Over Time</h2>
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary">
          Daily <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      <div style={{ height: 260, width: "100%" }}>
        <ResponsiveContainer height={260} width="100%">
          <AreaChart data={chartData} margin={{ left: -18, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="leadsFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.26} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#ECECF3" strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="date" tick={{ fill: "#8A8A9B", fontSize: 12 }} tickLine={false} />
            <YAxis axisLine={false} tick={{ fill: "#8A8A9B", fontSize: 12 }} tickLine={false} />
            <Area
              dataKey="leads"
              fill="url(#leadsFill)"
              stroke="#6366F1"
              strokeWidth={2}
              type="monotone"
              dot={<Dot r={4} fill="#6366F1" stroke="#fff" strokeWidth={2} />}
              activeDot={<Dot r={5} fill="#6366F1" stroke="#fff" strokeWidth={2} />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
