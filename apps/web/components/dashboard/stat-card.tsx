import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  change,
  period
}: {
  label: string;
  value: number | string;
  change: number;
  period: string;
}) {
  const isUp = change > 0;
  const isDown = change < 0;
  return (
    <section className="rounded-card bg-surface p-5 shadow-card">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <div className="mt-4 flex items-center gap-3">
        <p className="text-3xl font-bold tracking-tight text-text-primary">{typeof value === "number" ? value.toLocaleString() : value}</p>
        {change !== 0 ? (
          <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", isUp ? "bg-green-50 text-success" : "bg-red-50 text-red-500")}>
            {isUp ? "↑" : "↓"} {Math.abs(change)}%
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-text-secondary">{period}</p>
    </section>
  );
}
