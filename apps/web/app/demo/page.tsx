import { BrowserFrame } from "@/components/demo/browser-frame";
import { ChatWidget } from "@/components/demo/chat-widget";
import { LandingPageContent } from "@/components/demo/landing-page";
import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-page-bg">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
        <Link className="flex items-center gap-2 text-lg font-bold" href="/">
          <svg className="h-7 w-7" viewBox="0 0 36 36" fill="none">
            <defs>
              <linearGradient id="logoH" x1="0" y1="0" x2="36" y2="36">
                <stop offset="0%" stopColor="#7C3AED" />
                <stop offset="100%" stopColor="#6366F1" />
              </linearGradient>
            </defs>
            <rect width="36" height="36" rx="8" fill="url(#logoH)" />
            <path d="M10 24V12l8 6-8 6Zm16-6-8 6V12l8 6Z" fill="#fff" />
          </svg>
          <span className="bg-gradient-to-br from-[#7C3AED] to-[#6366F1] bg-clip-text text-transparent">LeadPilot AI</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-text-secondary hover:text-text-primary" href="/dashboard">Dashboard</Link>
          <Link className="text-text-secondary hover:text-text-primary" href="/voice-call">Voice Call</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-center text-3xl font-bold text-text-primary">
          Demo Preview
        </h1>
        <p className="mt-2 text-center text-text-secondary">
          See how LeadPilot AI looks on your website
        </p>

        <div className="relative mt-10">
          <BrowserFrame>
            <LandingPageContent />
            <div className="absolute bottom-4 right-4 z-10">
              <ChatWidget />
            </div>
          </BrowserFrame>
        </div>
      </section>
    </div>
  );
}
