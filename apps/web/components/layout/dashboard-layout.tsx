import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function DashboardLayout({
  children,
  workspaceName = "Demo Workspace",
  userName = "John Doe"
}: {
  children: ReactNode;
  workspaceName?: string;
  userName?: string;
}) {
  return (
    <div className="flex min-h-screen w-full bg-page-bg text-text-primary">
      <Sidebar workspaceName={workspaceName} userName={userName} />
      <main className="flex min-h-screen w-full flex-1 overflow-y-auto bg-page-bg px-6 py-6 lg:px-8 lg:py-8">
        <div className="w-full max-w-none">{children}</div>
      </main>
    </div>
  );
}
