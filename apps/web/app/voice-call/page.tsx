import { VoiceVisualizer } from "@/components/demo/voice-visualizer";
import { Mic, Sparkles, PhoneOff } from "lucide-react";

export default function VoiceCallPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page-bg p-6">
      <section className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#2A2A33] bg-gradient-to-b from-surface-dark to-surface-dark-alt shadow-2xl">
        <header className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#2A2A33] text-xs font-bold text-white">L</span>
            <span className="text-sm font-semibold text-white">LeadPilot AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Minimize" className="text-[#6B6B7B] hover:text-white" type="button">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <button aria-label="Close" className="text-[#6B6B7B] hover:text-white" type="button">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex flex-col items-center px-5 py-10">
          <VoiceVisualizer />
          <p className="mt-6 text-lg font-bold text-white">Listening...</p>
          <p className="mt-1 text-sm text-[#6B6B7B]">Speak now</p>
        </div>

        <div className="flex items-center justify-center gap-6 px-5 py-6">
          <button
            aria-label="Mute microphone"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2A33] text-[#6B6B7B] transition hover:bg-[#3A3A45] hover:text-white"
            type="button"
          >
            <Mic className="h-5 w-5" />
          </button>
          <button
            aria-label="End call"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444] text-white shadow-lg transition hover:bg-red-600"
            type="button"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            aria-label="Options"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2A33] text-[#6B6B7B] transition hover:bg-[#3A3A45] hover:text-white"
            type="button"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </section>
    </div>
  );
}
