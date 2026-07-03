"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { WidgetPreview } from "@/components/widget/widget-preview";
import { X, RotateCcw } from "lucide-react";

type WidgetSettingsData = {
  color: string;
  botName: string;
  welcomeMessage: string;
  avatarUrl: string;
  textColor: string;
  backgroundColor: string;
  position: string;
  launcherShape: string;
  launcherIcon: string;
  headerTitle: string;
  cornerRadius: number;
  sizePreset: string;
  showBranding: boolean;
  fontFamily: string;
  layout: string;
  voiceEnabled: boolean;
};

type CastingPreviewOverlayProps = {
  settings: WidgetSettingsData;
  onClose: () => void;
};

export function CastingPreviewOverlay({ settings, onClose }: CastingPreviewOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [autoPlayed, setAutoPlayed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [replayCount, setReplayCount] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (autoPlayed) return;
    const t = setTimeout(() => {
      setWidgetOpen(true);
      setAutoPlayed(true);
    }, 800);
    return () => clearTimeout(t);
  }, [autoPlayed]);

  const handleReplay = useCallback(() => {
    setWidgetOpen(false);
    setReplayCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (replayCount === 0) return;
    const t = setTimeout(() => setWidgetOpen(true), 400);
    return () => clearTimeout(t);
  }, [replayCount]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => closeRef.current?.focus());

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [handleKeyDown]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Widget preview"
    >
      <div className="relative mx-auto h-[90vh] w-[95vw] max-w-6xl rounded-2xl bg-white shadow-2xl">
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#374151] shadow-md transition hover:bg-white hover:text-[#111827]"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-full w-full overflow-hidden rounded-2xl">
          <div className="h-full w-full overflow-y-auto">
            <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-8 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-sm font-bold text-white">
                  L
                </div>
                <span className="text-lg font-bold text-[#111827]">LeadPilot</span>
              </div>
              <nav className="hidden items-center gap-6 sm:flex">
                <span className="cursor-default text-sm text-[#6B7280]">Features</span>
                <span className="cursor-default text-sm text-[#6B7280]">Pricing</span>
                <span className="cursor-default text-sm text-[#6B7280]">About</span>
                <span className="cursor-default rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white">
                  Get Started
                </span>
              </nav>
            </header>

            <section className="bg-gradient-to-br from-[#EEF0FE] to-white px-8 py-20 text-center">
              <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl">
                Supercharge Your Sales with AI
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-[#6B7280]">
                LeadPilot captures, qualifies, and converts leads automatically.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <span className="cursor-default rounded-lg bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-sm">
                  Start Free Trial
                </span>
                <span className="cursor-default rounded-lg border border-[#D1D5DB] bg-white px-6 py-3 text-sm font-semibold text-[#374151]">
                  Watch Demo
                </span>
              </div>
            </section>

            <section className="px-8 py-16">
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  { title: "Smart Lead Capture", text: "AI-powered forms that engage visitors and capture qualified leads 24/7." },
                  { title: "Instant Qualification", text: "Automatically score and route leads based on conversation context." },
                  { title: "Seamless Handoff", text: "Transfer hot leads to your sales team with full conversation history." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#EEF0FE] text-[#7C3AED]">
                      <div className="h-5 w-5 rounded bg-current opacity-60" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#111827]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#6B7280]">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-8 py-12 text-center text-sm text-[#9CA3AF]">
              &copy; 2024 LeadPilot. All rights reserved. This is a preview mockup.
            </section>
          </div>
        </div>

        <div className="absolute inset-0 z-10 overflow-visible pointer-events-none">
          <WidgetPreview
            settings={settings}
            isOpen={widgetOpen}
            onToggle={() => setWidgetOpen((p) => !p)}
            reducedMotion={reducedMotion}
          />
        </div>

        <button
          onClick={handleReplay}
          className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[#374151] shadow-md transition hover:bg-white"
          aria-label="Replay widget open animation"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Replay
        </button>
      </div>
    </div>
  );
}
