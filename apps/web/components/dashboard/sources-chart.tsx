"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export function SourcesChart({ data }: { data?: { name: string; value: number; color: string }[] }) {
  const chartData = data ?? [];
  const hasData = chartData.length > 0 && chartData.some((d) => d.value > 0);
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <h2 className="text-base font-semibold text-text-primary">Top Sources</h2>
      <div className="mt-4 flex items-center gap-4">
        {hasData ? (
          <>
            <div style={{ height: 180, width: 180, flexShrink: 0 }}>
              <ResponsiveContainer height={180} width="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={2}>
                    {chartData.map((entry) => (
                      <Cell fill={entry.color} key={entry.name} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {chartData.map((source) => (
                <div className="flex items-center justify-between text-sm" key={source.name}>
                  <span className="flex items-center gap-2 text-text-primary">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                    {source.name}
                  </span>
                  <span className="font-medium text-text-primary">{source.value}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-[180px] w-full items-center justify-center text-sm text-text-secondary">
            No data available yet
          </div>
        )}
      </div>
    </section>
  );
}
