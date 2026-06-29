"use client";

import { useState } from "react";

const quickReplies = [
  { icon: "💬", text: "Tell me about your services" },
  { icon: "💬", text: "What's your pricing?" },
  { icon: "💬", text: "Book a demo" },
  { icon: "💬", text: "I have another question" },
];

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {isOpen && (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card" style={{ width: "320px", maxHeight: "440px" }}>
          <header className="flex items-center justify-between bg-surface px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-light text-xs font-bold text-brand">L</span>
              <div>
                <p className="text-sm font-semibold text-text-primary">LeadPilot AI</p>
                <p className="flex items-center gap-1 text-xs text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Minimize" className="text-text-secondary hover:text-text-primary" onClick={() => setIsOpen(false)} type="button">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
              </button>
              <button aria-label="Close" className="text-text-secondary hover:text-text-primary" onClick={() => setIsOpen(false)} type="button">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8F9FE] px-4 py-4">
        <div className="max-w-[85%] rounded-lg bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-text-primary shadow-sm">
          Hi! 👋 How can I help you today?
        </div>
        <div className="space-y-2">
          {quickReplies.map((reply) => (
            <button
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left text-sm text-text-secondary transition hover:border-brand hover:text-brand"
              key={reply.text}
              type="button"
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {reply.text}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-[#F8F9FE] px-3 py-2 text-sm text-text-secondary">Type your message…</div>
          <button aria-label="Send" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-hover" type="button">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <footer className="pb-2 text-center text-[11px] text-text-secondary">Powered by LeadPilot AI</footer>
        </div>
      )}
      <button
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl hover:bg-brand-hover"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <svg fill="none" height="24" viewBox="0 0 24 24" width="24">
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          ) : (
            <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H10l-4.2 4.2A1 1 0 0 1 4 18.5v-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          )}
        </svg>
      </button>
    </>
  );
}
