import type { ReactNode } from "react";
import { Bot, Check } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#ffffff' }} className="max-lg:flex-col max-lg:overflow-y-auto">
      <section
        className="relative flex flex-col justify-center overflow-hidden px-16 max-lg:w-full xl:px-20"
        style={{ width: '50%', height: '100vh', background: 'linear-gradient(135deg,#0B1020 0%,#141233 55%,#1E1B3A 100%)' }}
      >
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 bg-violet-600/15 blur-3xl" />
        <div className="relative z-10 flex max-w-md flex-col gap-12">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6366F1]">
              <Bot className="h-12 w-12 text-white" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[36px] font-bold leading-tight text-white">LeadPilot AI</span>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-indigo-300">
                WORKSPACE COMMAND CENTER
              </p>
            </div>
          </div>
          <h1 className="max-w-md text-[36px] font-bold leading-tight text-white">
            Turn every website conversation into a trackable lead.
          </h1>
          <p className="max-w-md text-base leading-relaxed" style={{ color: 'rgba(255,255,255,.65)' }}>
            Create your workspace, install the widget, and manage projects from one clean dashboard.
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-[14px] w-[14px] text-emerald-400" />
              </div>
              <span className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,.9)' }}>Secure Supabase authentication</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-[14px] w-[14px] text-emerald-400" />
              </div>
              <span className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,.9)' }}>Workspace-based project ownership</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15">
                <Check className="h-[14px] w-[14px] text-emerald-400" />
              </div>
              <span className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,.9)' }}>Ready for chat, leads, and reporting</span>
            </div>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10 max-lg:w-full" style={{ width: '50%', height: '100vh' }}>
        {children}
      </section>
    </main>
  );
}
