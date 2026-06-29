import Link from "next/link";
import { cn } from "@/lib/utils";

export function SidebarNavItem({ href, label, isActive, children }: { href: string; label: string; isActive: boolean; children: React.ReactNode }) {
  return (
    <Link
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-text-primary transition hover:bg-brand hover:text-white",
        isActive && "bg-brand text-white"
      )}
      href={href}
    >
      {children}
      {label}
    </Link>
  );
}
