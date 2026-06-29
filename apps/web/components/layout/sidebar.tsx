"use client";

import {
  BarChart3,
  BookOpen,
  Bot,
  ChevronDown,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  Plug,
  Settings,
  Settings2,
  Shield,
  UserPlus,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarNavItem } from "./sidebar-nav-item";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/widget-settings", label: "Widget Settings", icon: Settings2 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/members", label: "Members", icon: UserPlus },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar({
  workspaceName,
  userName
}: {
  workspaceName: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-60 flex-shrink-0 flex-col border-r border-border bg-surface hidden lg:flex overflow-y-auto">
      <div className="flex h-full flex-col px-4 py-6">
        <Link className="flex items-center gap-3 px-2 text-xl font-bold" href="/dashboard">
          <span className="grid h-9 w-9 place-items-center rounded-[10px]" style={{ background: "linear-gradient(135deg, #7C3AED, #6366F1)" }}>
            <Bot className="h-5 w-5 text-white" />
          </span>
          <span className="bg-gradient-to-br from-[#7C3AED] to-[#6366F1] bg-clip-text text-transparent">LeadPilot AI</span>
        </Link>

        <button className="mt-8 flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left shadow-sm" type="button">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-light text-brand">
            <Shield className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text-primary">{workspaceName}</span>
            <span className="mt-1 inline-flex rounded-full bg-brand-light px-2 py-0.5 text-xs font-medium text-brand">Growth Plan</span>
          </span>
          <ChevronDown className="h-4 w-4 text-text-secondary" />
        </button>

        <nav className="mt-5 grid gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <SidebarNavItem href={item.href} key={item.label} label={item.label} isActive={isActive}>
                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-text-primary")} />
              </SidebarNavItem>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">Widget Status</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                Active
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-text-secondary">Your widget is live on 2 websites</p>
            <Link className="mt-4 inline-flex text-sm font-semibold text-brand" href="/projects">
              View Websites →
            </Link>
          </div>

          <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left shadow-sm" type="button">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-light text-sm font-bold text-brand">
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-text-primary">{userName}</span>
              <span className="text-xs text-text-secondary">Owner</span>
            </span>
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </aside>
  );
}
