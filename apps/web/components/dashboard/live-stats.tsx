"use client";

import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";

type StatsData = {
  conversations: number;
  leads: number;
  meetingsBooked: number;
  conversionRate: string;
};

const initialStats: StatsData = {
  conversations: 0,
  leads: 0,
  meetingsBooked: 0,
  conversionRate: "0.00",
};

export function LiveStats({ serverStats }: { serverStats: StatsData }) {
  const [stats, setStats] = useState<StatsData>(serverStats);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();
        if (!cancelled && json.success) {
          setStats(json.data);
        }
      } catch {}
    }
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const cards = [
    { label: "Total Leads", value: stats.leads, change: 0, period: "vs last 7 days" },
    { label: "Conversations", value: stats.conversations, change: 0, period: "vs last 7 days" },
    { label: "Meetings Booked", value: stats.meetingsBooked, change: 0, period: "vs last 7 days" },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, change: 0, period: "vs last 7 days" },
  ];

  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <StatCard change={card.change} key={card.label} label={card.label} period={card.period} value={card.value} />
      ))}
    </section>
  );
}
