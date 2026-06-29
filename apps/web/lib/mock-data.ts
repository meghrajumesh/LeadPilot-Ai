export const dashboardStats = [
  { label: "Total Leads", value: 248, change: 18.5, period: "vs last 7 days" },
  { label: "Conversations", value: 1382, change: 23.1, period: "vs last 7 days" },
  { label: "Meetings Booked", value: 32, change: 14.3, period: "vs last 7 days" },
  { label: "Conversion Rate", value: "2.31%", change: 8.2, period: "vs last 7 days" }
];

export const leadsOverTime = [
  { date: "May 12", leads: 20 },
  { date: "May 13", leads: 50 },
  { date: "May 14", leads: 38 },
  { date: "May 15", leads: 42 },
  { date: "May 16", leads: 55 },
  { date: "May 17", leads: 38 },
  { date: "May 18", leads: 52 },
  { date: "May 19", leads: 78 }
];

export const topSources = [
  { name: "Direct / Organic", value: 45, color: "#6366F1" },
  { name: "Referral", value: 28, color: "#3B82F6" },
  { name: "Social Media", value: 17, color: "#22C55E" },
  { name: "Other", value: 10, color: "#F59E0B" }
];

export const recentLeads = [
  { name: "Sarah Johnson", email: "sarah.j@email.com", source: "Website Chat", time: "2m ago", status: "New" as const },
  { name: "Michael Chen", email: "michael.c@email.com", source: "Voice Call", time: "15m ago", status: "Contacted" as const },
  { name: "Emily Davis", email: "emily.d@email.com", source: "Website Chat", time: "1h ago", status: "Qualified" as const },
  { name: "David Wilson", email: "david.w@email.com", source: "Referral", time: "2h ago", status: "New" as const },
  { name: "Sophia Martinez", email: "sophia.m@email.com", source: "Voice Call", time: "3h ago", status: "Contacted" as const }
];

export const liveConversations = [
  { visitor: "Visitor on Homepage", message: "Hi! How can I help you today?", time: "Just now", online: true },
  { visitor: "Pricing Page Visitor", message: "Can you tell me about your pricing?", time: "Just now", online: true },
  { visitor: "Product Page Visitor", message: "What features do you offer?", time: "1m ago", online: true },
  { visitor: "Visitor on Homepage", message: "I'd like to book a demo.", time: "2m ago", online: false }
];
