import React, { Component, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ApiResponse, WidgetConfigResponse, WidgetConfig } from "@leadpilot/types";

type MountOptions = {
  root: ShadowRoot | HTMLElement;
  widgetKey: string;
  apiUrl: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type WidgetStatus = "collapsed" | "open" | "loading" | "error";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

const roots = new WeakMap<ShadowRoot | HTMLElement, Root>();

declare global {
  interface Window {
    LeadPilotWidget?: {
      mount(options: MountOptions): void;
    };
  }
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="lp-error">LeadPilot widget could not load.</div>;
    }
    return this.props.children;
  }
}

function createVisitorId() {
  const storageKey = "leadpilot_visitor_id";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }
  const visitorId = crypto.randomUUID();
  window.localStorage.setItem(storageKey, visitorId);
  return visitorId;
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.success) {
    throw new Error(payload.error);
  }
  return payload.data;
}

function styles(config: {
  color: string;
  textColor: string;
  backgroundColor: string;
  position: string;
  launcherShape: string;
  cornerRadius: number;
  sizePreset: string;
  fontFamily: string;
  layout: string;
}) {
  const launcherRadius = config.launcherShape === "square" ? config.cornerRadius : 9999;
  const panelRadius = `${config.cornerRadius}px`;
  const bubbleRadius = config.cornerRadius - 4;
  const pos = positionStyles(config.position);
  const size = sizeStyles(config.sizePreset);
  const template = config.layout;
  const font = `${config.fontFamily}, ${FONT_FALLBACK}`;

  const baseStyle = `
    :host { all: initial; }
    .lp-widget, .lp-widget * { box-sizing: border-box; font-family: ${font}; }
    .lp-widget { position: fixed; z-index: 2147483647; ${pos} color: #0f172a; }
    .lp-messages { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
    .lp-messages::-webkit-scrollbar { display: none; }
    .lp-footer { text-align: center; color: #64748b; font-size: 11px; }
    @keyframes lp-pop { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes lp-blink { 0%, 80%, 100% { opacity: 0.35; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-2px); } }
    @keyframes lp-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes lp-scale-in { from { opacity: 0; transform: scale(0.4) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes lp-radiate { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes lp-idle-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes lp-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); } 70% { box-shadow: 0 0 0 14px rgba(99,102,241,0); } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } }
    .lp-typing { display: inline-flex; gap: 4px; padding: 12px; }
    .lp-typing span { width: 6px; height: 6px; border-radius: 999px; background: #94a3b8; animation: lp-blink 900ms infinite ease-in-out; }
    .lp-typing span:nth-child(2) { animation-delay: 120ms; }
    .lp-typing span:nth-child(3) { animation-delay: 240ms; }
    @media (max-width: 520px) { .lp-widget { right: 12px !important; bottom: 12px !important; } .lp-panel { width: calc(100vw - 24px); height: calc(100vh - 24px); border-radius: 16px; } }
  `;

  if (template === "bar") {
    return baseStyle + `
      .lp-launcher { height: 42px; padding: 0 18px; border: 0; border-radius: 9999px; background: ${config.color}; color: ${config.textColor}; cursor: pointer; box-shadow: 0 8px 24px rgba(15,23,42,0.18); display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; white-space: nowrap; transition: transform 160ms ease, box-shadow 160ms ease; }
      .lp-launcher:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(15,23,42,0.22); }
      .lp-panel { width: ${size.w}; height: ${size.h}; display: flex; flex-direction: column; overflow: hidden; background: ${config.backgroundColor}; box-shadow: 0 24px 80px rgba(15,23,42,0.18); border-radius: 0; animation: lp-pop 200ms ease-out; }
      .lp-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: ${config.backgroundColor}; color: ${config.color}; border-bottom: 1px solid rgba(15,23,42,0.06); }
      .lp-header-title { font-size: 13px; font-weight: 700; }
      .lp-close { border: 0; background: transparent; color: #94a3b8; cursor: pointer; font-size: 13px; padding: 4px; line-height: 1; }
      .lp-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 10px; background: #fff; }
      .lp-bubble { max-width: 82%; margin: 0 0 6px; padding: 7px 10px; border-radius: 6px; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
      .lp-user { margin-left: auto; background: ${config.color}; color: ${config.textColor}; }
      .lp-assistant { margin-right: auto; background: #f1f5f9; color: #0f172a; }
      .lp-form { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-top: 1px solid rgba(15,23,42,0.06); background: ${config.backgroundColor}; }
      .lp-input { flex: 1; min-width: 0; border: none; padding: 7px 4px; font-size: 13px; outline: none; background: transparent; }
      .lp-send { border: 0; border-radius: 6px; background: ${config.color}; color: ${config.textColor}; padding: 0 10px; height: 28px; font-weight: 600; cursor: pointer; font-size: 12px; }
      .lp-send:disabled { opacity: 0.55; cursor: not-allowed; }
      .lp-footer { padding: 0 10px 8px; background: ${config.backgroundColor}; }
    `;
  }

  if (template === "voice") {
    return baseStyle + `
      .lp-launcher { width: 58px; height: 58px; border: 0; border-radius: 9999px; background: ${config.color}; color: ${config.textColor}; cursor: pointer; box-shadow: 0 18px 42px rgba(15,23,42,0.24); display: grid; place-items: center; transition: transform 160ms ease, box-shadow 160ms ease; position: relative; }
      .lp-launcher:hover { transform: translateY(-2px); box-shadow: 0 22px 50px rgba(15,23,42,0.28); }
      .lp-panel { width: ${size.w}; height: ${size.h}; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(15,23,42,0.12); border-radius: ${panelRadius}; background: ${config.backgroundColor}; box-shadow: 0 24px 80px rgba(15,23,42,0.22); animation: lp-radiate 280ms cubic-bezier(0.34,1.56,0.64,1); }
      .lp-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; background: ${config.color}; color: ${config.textColor}; }
      .lp-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .lp-avatar { width: 38px; height: 38px; flex: 0 0 auto; border-radius: 999px; background: rgba(255,255,255,0.22); display: grid; place-items: center; font-weight: 700; font-size: 16px; }
      .lp-name { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.2; }
      .lp-online { margin: 3px 0 0; display: flex; align-items: center; gap: 6px; font-size: 12px; opacity: 0.92; }
      .lp-dot { width: 7px; height: 7px; border-radius: 999px; background: #34d399; }
      .lp-close { border: 0; background: rgba(255,255,255,0.16); color: ${config.textColor}; border-radius: 999px; width: 32px; height: 32px; cursor: pointer; font-size: 14px; font-weight: 600; display: grid; place-items: center; }
      .lp-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; background: #f8fafc; }
      .lp-bubble { max-width: 82%; margin: 0 0 10px; padding: 10px 12px; border-radius: ${bubbleRadius}px; font-size: 14px; line-height: 1.45; overflow-wrap: anywhere; }
      .lp-user { margin-left: auto; background: ${config.color}; color: ${config.textColor}; border-bottom-right-radius: 4px; }
      .lp-assistant { margin-right: auto; background: #fff; color: #0f172a; border: 1px solid rgba(15,23,42,0.08); border-bottom-left-radius: 4px; }
      .lp-form { padding: 12px 16px 16px; border-top: 1px solid rgba(15,23,42,0.08); background: ${config.backgroundColor}; display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .lp-form-row { display: flex; gap: 8px; width: 100%; }
      .lp-input { flex: 1; min-width: 0; border: 1px solid #cbd5e1; border-radius: 12px; padding: 9px 12px; font-size: 13px; outline: none; background: ${config.backgroundColor}; }
      .lp-input:focus { border-color: ${config.color}; box-shadow: 0 0 0 3px color-mix(in srgb, ${config.color} 18%, transparent); }
      .lp-send { border: 0; border-radius: 12px; background: ${config.color}; color: ${config.textColor}; padding: 0 14px; font-weight: 700; cursor: pointer; font-size: 13px; }
      .lp-send:disabled { cursor: not-allowed; opacity: 0.55; }
      .lp-footer { padding: 0 12px 10px; background: ${config.backgroundColor}; }
    `;
  }

  if (template === "terminal") {
    const mono = '"ui-monospace", "Menlo", "Consolas", monospace';
    return baseStyle + `
      .lp-launcher { padding: 0; border: 0; background: transparent; cursor: pointer; display: flex; flex-direction: column; align-items: flex-end; gap: 0; }
      .lp-launcher-preview { font-family: ${mono}; font-size: 11px; color: #8b949e; background: #161b22; border: 1px solid #30363d; border-radius: 8px 8px 8px 4px; padding: 6px 10px; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 4px 12px rgba(0,0,0,0.3); margin-bottom: 4px; text-align: left; }
      .lp-launcher-preview span { color: ${config.color}; }
      .lp-launcher-btn { width: 44px; height: 44px; border-radius: 0 999px 999px 999px; background: ${config.color}; color: ${config.textColor}; display: grid; place-items: center; font-size: 18px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); border: 0; cursor: pointer; }
      .lp-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 2147483646; animation: lp-fade-in 200ms ease; }
      .lp-panel { width: min(calc(${size.w} + 40px), 90vw); max-width: 480px; height: min(${size.h}, 540px, 80vh); display: flex; flex-direction: column; overflow: hidden; background: #0d1117; border: 1px solid #30363d; border-radius: 10px; box-shadow: 0 24px 80px rgba(0,0,0,0.6); font-family: ${mono}; animation: lp-scale-in 220ms cubic-bezier(0.16,1,0.3,1); }
      .lp-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; background: #161b22; color: #c9d1d9; border-bottom: 1px solid #30363d; font-family: ${mono}; }
      .lp-header-prompt { color: ${config.color}; font-size: 13px; font-weight: 700; }
      .lp-header-title { font-size: 13px; font-weight: 600; color: #c9d1d9; font-family: ${mono}; }
      .lp-close { border: 0; background: transparent; color: #8b949e; cursor: pointer; font-size: 14px; padding: 2px; line-height: 1; }
      .lp-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; background: #0d1117; }
      .lp-bubble { max-width: 94%; margin: 0 0 4px; padding: 6px 10px; border-radius: 4px; font-size: 13px; line-height: 1.6; font-family: ${mono}; overflow-wrap: anywhere; }
      .lp-user { margin-left: auto; background: #0d1117; color: #58a6ff; border-bottom-right-radius: 0; }
      .lp-assistant { margin-right: auto; background: #161b22; color: #8b949e; border: 1px solid #30363d; border-bottom-left-radius: 0; }
      .lp-form { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-top: 1px solid #30363d; background: #0d1117; font-family: ${mono}; }
      .lp-prompt { color: ${config.color}; font-size: 13px; font-weight: 700; flex-shrink: 0; }
      .lp-input { flex: 1; min-width: 0; border: none; padding: 6px 0; font-size: 13px; outline: none; background: transparent; color: #c9d1d9; font-family: ${mono}; }
      .lp-cursor { width: 7px; height: 14px; background: ${config.color}; animation: lp-blink-cursor 1s step-end infinite; flex-shrink: 0; }
      .lp-send { display: none; }
      .lp-footer { padding: 0 14px 10px; text-align: center; color: #484f58; font-size: 11px; background: #0d1117; font-family: ${mono}; }
      @keyframes lp-blink-cursor { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
      @keyframes lp-fade-in { from { opacity: 0; } to { opacity: 1; } }
    `;
  }

  if (template === "command") {
    const mono = '"ui-monospace", "Menlo", "Consolas", monospace';
    return baseStyle + `
      .lp-launcher { display: flex; align-items: center; height: 48px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 24px rgba(15,23,42,0.12); padding: 0 4px 0 14px; font-family: ${mono}; cursor: default; }
      .lp-launcher-prompt { color: #94a3b8; font-size: 13px; margin-right: 6px; }
      .lp-launcher-input { flex: 1; min-width: 0; border: none; outline: none; font-size: 13px; background: transparent; color: #0f172a; font-family: ${mono}; }
      .lp-launcher-input::placeholder { color: #94a3b8; }
      .lp-launcher-send { width: 36px; height: 36px; border: 0; border-radius: 8px; cursor: pointer; display: grid; place-items: center; transition: background 150ms; }
      .lp-panel { width: ${size.w}; height: ${size.h}; display: flex; flex-direction: column; overflow: hidden; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 24px 80px rgba(15,23,42,0.18); font-family: ${mono}; animation: lp-pop 220ms ease-out; }
      .lp-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 14px; background: #ffffff; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-family: ${mono}; }
      .lp-header-prompt { color: ${config.color}; font-size: 13px; font-weight: 700; }
      .lp-header-title { font-size: 13px; font-weight: 600; color: #0f172a; font-family: ${mono}; }
      .lp-close { border: 0; background: transparent; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 2px; line-height: 1; }
      .lp-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; background: #f8fafc; }
      .lp-bubble { max-width: 82%; margin: 0 0 4px; padding: 8px 12px; border-radius: 8px; font-size: 13px; line-height: 1.45; font-family: ${mono}; overflow-wrap: anywhere; }
      .lp-user { margin-left: auto; background: ${config.color}; color: ${config.textColor}; }
      .lp-assistant { margin-right: auto; background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
      .lp-form { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-top: 1px solid #e2e8f0; background: #ffffff; font-family: ${mono}; }
      .lp-form-prompt { color: ${config.color}; font-size: 13px; font-weight: 700; flex-shrink: 0; }
      .lp-input { flex: 1; min-width: 0; border: none; padding: 6px 0; font-size: 13px; outline: none; background: transparent; color: #0f172a; font-family: ${mono}; }
      .lp-send { border: 0; border-radius: 8px; background: ${config.color}; color: ${config.textColor}; padding: 0 12px; height: 30px; font-weight: 600; cursor: pointer; font-size: 12px; font-family: ${mono}; }
      .lp-send:disabled { opacity: 0.55; cursor: not-allowed; }
      .lp-footer { padding: 0 14px 10px; text-align: center; color: #64748b; font-size: 11px; background: #ffffff; font-family: ${mono}; }
    `;
  }

  return baseStyle + `
    .lp-launcher { width: 58px; height: 58px; border: 0; border-radius: ${launcherRadius}px; background: ${config.color}; color: ${config.textColor}; cursor: pointer; box-shadow: 0 18px 42px rgba(15,23,42,0.24); display: grid; place-items: center; transition: transform 160ms ease, box-shadow 160ms ease; animation: lp-idle-bob 3s ease-in-out infinite; }
    .lp-launcher:hover { transform: translateY(-2px); box-shadow: 0 22px 50px rgba(15,23,42,0.28); }
    .lp-panel { width: ${size.w}; height: ${size.h}; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgba(15,23,42,0.12); border-radius: ${panelRadius}; background: ${config.backgroundColor}; box-shadow: 0 24px 80px rgba(15,23,42,0.22); animation: lp-scale-in 220ms cubic-bezier(0.34,1.56,0.64,1); }
    .lp-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; background: ${config.color}; color: ${config.textColor}; }
    .lp-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .lp-avatar { width: 38px; height: 38px; flex: 0 0 auto; border-radius: 999px; background: rgba(255,255,255,0.22); display: grid; place-items: center; font-weight: 700; }
    .lp-name { margin: 0; font-size: 15px; font-weight: 700; line-height: 1.2; }
    .lp-online { margin: 3px 0 0; display: flex; align-items: center; gap: 6px; font-size: 12px; opacity: 0.92; }
    .lp-dot { width: 7px; height: 7px; border-radius: 999px; background: #34d399; }
    .lp-close { border: 0; background: rgba(255,255,255,0.16); color: ${config.textColor}; border-radius: 999px; width: 32px; height: 32px; cursor: pointer; }
    .lp-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; background: #f8fafc; }
    .lp-bubble { max-width: 82%; margin: 0 0 10px; padding: 10px 12px; border-radius: ${bubbleRadius}px; font-size: 14px; line-height: 1.45; overflow-wrap: anywhere; }
    .lp-user { margin-left: auto; background: ${config.color}; color: ${config.textColor}; border-bottom-right-radius: 4px; }
    .lp-assistant { margin-right: auto; background: #fff; color: #0f172a; border: 1px solid rgba(15,23,42,0.08); border-bottom-left-radius: 4px; }
    .lp-form { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 12px; border-top: 1px solid rgba(15,23,42,0.08); background: ${config.backgroundColor}; }
    .lp-input { min-width: 0; border: 1px solid #cbd5e1; border-radius: 12px; padding: 11px 12px; font-size: 14px; outline: none; background: ${config.backgroundColor}; }
    .lp-input:focus { border-color: ${config.color}; box-shadow: 0 0 0 3px color-mix(in srgb, ${config.color} 18%, transparent); }
    .lp-send { border: 0; border-radius: 12px; background: ${config.color}; color: ${config.textColor}; padding: 0 14px; font-weight: 700; cursor: pointer; }
    .lp-send:disabled { cursor: not-allowed; opacity: 0.55; }
    .lp-footer { padding: 0 12px 10px; background: ${config.backgroundColor}; }
  `;
}

const FONT_FALLBACK = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function positionStyles(position: string): string {
  switch (position) {
    case "bottom-left": return "left: 20px; bottom: 20px;";
    case "top-right": return "right: 20px; top: 20px;";
    case "top-left": return "left: 20px; top: 20px;";
    default: return "right: 20px; bottom: 20px;";
  }
}

function sizeStyles(preset: string): { w: string; h: string } {
  switch (preset) {
    case "S": return { w: "min(320px, calc(100vw - 32px))", h: "min(500px, calc(100vh - 32px))" };
    case "L": return { w: "min(440px, calc(100vw - 32px))", h: "min(720px, calc(100vh - 32px))" };
    default: return { w: "min(380px, calc(100vw - 32px))", h: "min(620px, calc(100vh - 32px))" };
  }
}

function micSvg(size = 16) {
  return (
    <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function chatSvg() {
  return (
    <svg aria-hidden="true" fill="none" height="26" viewBox="0 0 24 24" width="26">
      <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H10l-4.2 4.2A1 1 0 0 1 4 18.5v-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function Widget({ widgetKey, apiUrl }: { widgetKey: string; apiUrl: string }) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [status, setStatus] = useState<WidgetStatus>("collapsed");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const visitorId = useMemo(createVisitorId, []);
  const conversationIdRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestJson<WidgetConfigResponse>(`${apiUrl}/api/widget/config?widgetKey=${encodeURIComponent(widgetKey)}`)
      .then((data) => {
        setConfig(data.config);
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: data.config.welcomeMessage
          }
        ]);
      })
      .catch((caught: unknown) => {
        const msg = caught instanceof Error ? caught.message : "Unable to load widget";
        console.error("[LeadPilot] config fetch failed:", msg);
        setError(msg);
        setStatus("error");
      });
  }, [apiUrl, widgetKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  async function openWidget() {
    setStatus("open");
  }

  function backdropClose(e: React.MouseEvent) {
    if (e.target === e.currentTarget) setStatus("collapsed");
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content) {
      return;
    }

    setDraft("");
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
    setMessages((current) => [...current, userMessage]);
    setStatus("loading");

    try {
      const history = [...messages, userMessage];
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetKey: widgetKey,
          visitorId: visitorId,
          conversationId: conversationIdRef.current,
          messages: history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error(`[LeadPilot] chat error (${res.status}):`, errData.error || res.statusText);
        throw new Error(errData.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      if (data.conversationId) conversationIdRef.current = data.conversationId;
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: data.reply },
      ]);
      setStatus("open");
    } catch (caught) {
      const realMsg = caught instanceof Error ? caught.message : String(caught);
      console.error("[LeadPilot] chat request failed:", realMsg);
      const friendlyMsg = "Sorry, I ran into a hiccup. Please try again in a moment.";
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: friendlyMsg },
      ]);
      setStatus("open");
    }
  }

  const activeColor = config?.color ?? "#2563eb";
  const template = config?.layout ?? "bubble";
  const showVoice = config?.voiceEnabled ?? false;
  const styleConfig = {
    color: activeColor,
    textColor: config?.textColor ?? "#ffffff",
    backgroundColor: config?.backgroundColor ?? "#ffffff",
    position: config?.position ?? "bottom-right",
    launcherShape: config?.launcherShape ?? "round",
    cornerRadius: config?.cornerRadius ?? 18,
    sizePreset: config?.sizePreset ?? "M",
    fontFamily: config?.fontFamily ?? "Inter",
    layout: template,
  };

  const renderLauncherIcon = () => {
    if (config?.launcherIcon) {
      return <span style={{ fontSize: 26 }}>{config.launcherIcon}</span>;
    }
    if (template === "voice") return micSvg(26);
    return chatSvg();
  };

  const renderBarLauncher = () => (
    <button aria-label="Open chat" className="lp-launcher" onClick={openWidget} type="button">
      {config?.launcherIcon ? <span style={{ fontSize: 18 }}>{config.launcherIcon}</span> : chatSvg()}
      {config?.headerTitle || config?.botName || "Chat with us"}
    </button>
  );

  const renderTerminalLauncher = () => {
    const msg = config?.welcomeMessage ?? "";
    return (
      <button aria-label="Open chat" className="lp-launcher" onClick={openWidget} type="button">
        <div className="lp-launcher-preview">
          <span>$ </span>{msg.slice(0, 28)}{msg.length > 28 ? "…" : ""}
        </div>
        <div className="lp-launcher-btn">
          {config?.launcherIcon ? <span style={{ fontSize: 18 }}>{config.launcherIcon}</span> : chatSvg()}
        </div>
      </button>
    );
  };

  const [launcherDraft, setLauncherDraft] = useState("");

  function handleCommandSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = launcherDraft.trim();
    if (text) {
      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setLauncherDraft("");
      setStatus("loading");
      sendMessageToApi(text);
    } else {
      setStatus("open");
    }
  }

  async function sendMessageToApi(text: string) {
    try {
      const history = [...messages, { id: crypto.randomUUID(), role: "user" as const, content: text }];
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetKey,
          visitorId,
          conversationId: conversationIdRef.current,
          messages: history.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            content: m.content,
          })),
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      if (data.conversationId) conversationIdRef.current = data.conversationId;
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: data.reply }]);
      setStatus("open");
    } catch {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I hit a snag. Try again?" }]);
      setStatus("open");
    }
  }

  const renderCommandLauncher = () => (
    <form className="lp-launcher" onSubmit={handleCommandSubmit}>
      <span className="lp-launcher-prompt">&gt;</span>
      <input
        autoFocus
        className="lp-launcher-input"
        value={launcherDraft}
        onChange={(e) => setLauncherDraft(e.target.value)}
        placeholder="Ask us anything..."
      />
      <button
        type="submit"
        aria-label="Send"
        className="lp-launcher-send"
        style={{
          background: launcherDraft.trim() ? (config?.color ?? "#1e293b") : "#e2e8f0",
          color: launcherDraft.trim() ? (config?.textColor ?? "#ffffff") : "#94a3b8",
        }}
      >
        <svg fill="none" height={16} viewBox="0 0 24 24" width={16}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
      </button>
    </form>
  );

  const renderHeader = () => {
    if (template === "bar") {
      return (
        <header className="lp-header">
          <span className="lp-header-title">{config?.headerTitle || config?.botName || "Chat"}</span>
          <button aria-label="Close chat" className="lp-close" onClick={() => setStatus("collapsed")} type="button">x</button>
        </header>
      );
    }
    if (template === "terminal") {
      return (
        <header className="lp-header">
          <span className="lp-header-prompt">$</span>
          <span className="lp-header-title">{config?.headerTitle ?? "Console Chat"}</span>
          <button aria-label="Close chat" className="lp-close" onClick={() => setStatus("collapsed")} type="button">x</button>
        </header>
      );
    }
    if (template === "command") {
      return (
        <header className="lp-header">
          <span className="lp-header-prompt">&gt;</span>
          <span className="lp-header-title">{config?.headerTitle ?? "Command"}</span>
          <button aria-label="Close chat" className="lp-close" onClick={() => setStatus("collapsed")} type="button">x</button>
        </header>
      );
    }
    return (
      <header className="lp-header">
        <div className="lp-identity">
          <div className="lp-avatar">{config?.botName.charAt(0) ?? "L"}</div>
          <div>
            <p className="lp-name">{config?.headerTitle ?? config?.botName ?? "LeadPilot"}</p>
            <p className="lp-online"><span className="lp-dot" /> Online</p>
          </div>
        </div>
        <button aria-label="Close chat" className="lp-close" onClick={() => setStatus("collapsed")} type="button">x</button>
      </header>
    );
  };

  const renderComposer = () => {
    if (template === "bar") {
      return (
        <form className="lp-form" onSubmit={sendMessage}>
          <input
            className="lp-input"
            disabled={status === "loading"}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Message..."
            value={draft}
          />
          <button className="lp-send" disabled={status === "loading" || !draft.trim()} type="submit">Send</button>
        </form>
      );
    }
    if (template === "voice") {
      return (
        <form className="lp-form" onSubmit={sendMessage}>
          <div className="lp-form-row">
            <input
              className="lp-input"
              disabled={status === "loading"}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type or speak..."
              value={draft}
            />
            <button className="lp-send" disabled={status === "loading" || !draft.trim()} type="submit">Send</button>
          </div>
        </form>
      );
    }
    if (template === "terminal") {
      return (
        <form className="lp-form" onSubmit={sendMessage}>
          <span className="lp-prompt">+</span>
          <input
            className="lp-input"
            disabled={status === "loading"}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a command..."
            value={draft}
          />
          <span className="lp-cursor" />
        </form>
      );
    }
    if (template === "command") {
      return (
        <form className="lp-form" onSubmit={sendMessage}>
          <span className="lp-form-prompt">&gt;</span>
          <input
            className="lp-input"
            disabled={status === "loading"}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            value={draft}
          />
          <button className="lp-send" disabled={status === "loading" || !draft.trim()} type="submit">Send</button>
        </form>
      );
    }
    return (
      <form className="lp-form" onSubmit={sendMessage}>
        <input
          className="lp-input"
          disabled={status === "loading"}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message..."
          value={draft}
        />
        <button className="lp-send" disabled={status === "loading" || !draft.trim()} type="submit">Send</button>
      </form>
    );
  };

  return (
    <>
      <style>{styles(styleConfig)}</style>
      <div className="lp-widget">
        {status === "collapsed" ? (
          template === "bar" ? renderBarLauncher() :
          template === "terminal" ? renderTerminalLauncher() :
          template === "command" ? renderCommandLauncher() : (
            <button aria-label="Open chat" className="lp-launcher" onClick={openWidget} type="button">
              {renderLauncherIcon()}
            </button>
          )
        ) : template === "terminal" ? (
          <div className="lp-backdrop" onClick={backdropClose}>
            <section aria-label="LeadPilot chat" className="lp-panel" onClick={(e) => e.stopPropagation()}>
              {renderHeader()}
              <div className="lp-messages" ref={scrollRef}>
                {messages.map((message) => (
                  <p className={`lp-bubble lp-${message.role}`} key={message.id}>
                    {message.role === "assistant" ? <span className="lp-prompt">$</span> : null}
                    {message.content}
                  </p>
                ))}
                {status === "loading" ? (
                  <div className="lp-bubble lp-assistant lp-typing" aria-label="Typing">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : null}
                {status === "error" ? <p className="lp-bubble lp-assistant">{error ?? "Something went wrong."}</p> : null}
              </div>
              {renderComposer()}
              {config?.showBranding !== false && (
                <footer className="lp-footer">Powered by LeadPilot</footer>
              )}
            </section>
          </div>
        ) : (
          <section aria-label="LeadPilot chat" className="lp-panel">
            {renderHeader()}
            <div className="lp-messages" ref={scrollRef}>
              {messages.map((message) => (
                <p className={`lp-bubble lp-${message.role}`} key={message.id}>{message.content}</p>
              ))}
              {status === "loading" ? (
                <div className="lp-bubble lp-assistant lp-typing" aria-label="Typing">
                  <span />
                  <span />
                  <span />
                </div>
              ) : null}
              {status === "error" ? <p className="lp-bubble lp-assistant">{error ?? "Something went wrong."}</p> : null}
            </div>
            {renderComposer()}
            {config?.showBranding !== false && (
              <footer className="lp-footer">Powered by LeadPilot</footer>
            )}
          </section>
        )}
      </div>
    </>
  );
}

window.LeadPilotWidget = {
  mount(options: MountOptions) {
    const existingRoot = roots.get(options.root);
    existingRoot?.unmount();

    if (!options.widgetKey) {
      console.warn("LeadPilot: mount called without widgetKey");
      return;
    }

    const root = createRoot(options.root);
    roots.set(options.root, root);
    root.render(
      <ErrorBoundary>
        <Widget widgetKey={options.widgetKey} apiUrl={options.apiUrl.replace(/\/$/, "")} />
      </ErrorBoundary>
    );
  }
};
