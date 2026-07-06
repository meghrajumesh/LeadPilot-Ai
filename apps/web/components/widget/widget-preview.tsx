"use client";

import { useState } from "react";

type WidgetPreviewSettings = {
  color: string;
  textColor: string;
  backgroundColor: string;
  position: string;
  launcherShape: string;
  launcherIcon: string;
  headerTitle: string;
  welcomeMessage: string;
  botName: string;
  cornerRadius: number;
  sizePreset: string;
  showBranding: boolean;
  fontFamily: string;
  layout: string;
  voiceEnabled: boolean;
  callEnabled?: boolean;
  quickActions?: { label: string; icon: string; action: string; value: string }[];
};

type MicState = "idle" | "recording" | "disabled";

const sizeMap: Record<string, { w: number; h: number }> = {
  S: { w: 320, h: 500 },
  M: { w: 380, h: 620 },
  L: { w: 440, h: 720 },
};

function posEdges(position: string) {
  const right = position.includes("right");
  const bottom = position.includes("bottom");
  return { right, bottom };
}
function flexPos(position: string) {
  const right = position.includes("right");
  const bottom = position.includes("bottom");
  return { justifyContent: right ? "flex-end" : "flex-start", alignItems: bottom ? "flex-end" : "flex-start" };
}

const micSvg = (size = 16) => (
  <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const speakerSvg = (
  <svg fill="none" height={14} viewBox="0 0 24 24" width={14}>
    <path d="M11 5 6 9H2v6h4l5 4V5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const speakerPlayingSvg = (
  <svg fill="none" height={14} viewBox="0 0 24 24" width={14}>
    <path d="M11 5 6 9H2v6h4l5 4V5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M12 10a2 2 0 0 1 0 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const chatSvg = (
  <svg aria-hidden="true" fill="none" height={26} viewBox="0 0 24 24" width={26}>
    <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H10l-4.2 4.2A1 1 0 0 1 4 18.5v-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

function MicButton({ state, onClick, size = 32 }: { state: MicState; onClick: () => void; size?: number }) {
  const isRecording = state === "recording";
  const isDisabled = state === "disabled";
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      type="button"
      aria-label={isRecording ? "Stop recording" : "Voice input"}
      style={{
        border: 0,
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderRadius: 9999,
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        background: isRecording ? "#ef4444" : isDisabled ? "#e5e7eb" : "transparent",
        color: isRecording ? "#fff" : isDisabled ? "#cbd5e1" : "#64748b",
        transition: "background 200ms, color 200ms, transform 200ms",
        animation: isRecording ? "lp-pulse-mic 1.2s ease-in-out infinite" : "none",
        transform: isRecording ? "scale(1.08)" : "scale(1)",
      }}
    >
      {micSvg()}
    </button>
  );
}

function VoiceReplyButton({ messageId, playing, onClick, size = 26 }: { messageId: string; playing: boolean; onClick: (id: string) => void; size?: number }) {
  return (
    <button
      onClick={() => onClick(messageId)}
      type="button"
      aria-label={playing ? "Stop playback" : "Play message"}
      style={{
        border: 0,
        cursor: "pointer",
        borderRadius: 9999,
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        background: playing ? "rgba(99,102,241,0.12)" : "transparent",
        color: playing ? "#6366f1" : "#94a3b8",
        transition: "all 200ms",
        animation: playing ? "lp-pulse-play 1s ease-in-out infinite" : "none",
      }}
    >
      {playing ? speakerPlayingSvg : speakerSvg}
    </button>
  );
}

const keyframesStyle = `
@keyframes lp-pulse-mic {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
  50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
}
@keyframes lp-pulse-play {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}
@keyframes lp-idle-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
@keyframes lp-pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(var(--pulse-r,99), var(--pulse-g,102), var(--pulse-b,241), 0.5); }
  70% { box-shadow: 0 0 0 14px rgba(var(--pulse-r,99), var(--pulse-g,102), var(--pulse-b,241), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--pulse-r,99), var(--pulse-g,102), var(--pulse-b,241), 0); }
}
@keyframes lp-blink-cursor {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
`;

export function WidgetPreview({
  settings,
  defaultOpen = false,
  isOpen: externalOpen,
  onToggle,
  reducedMotion = false,
  showBoth = false,
}: {
  settings: WidgetPreviewSettings;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  reducedMotion?: boolean;
  showBoth?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;

  const toggle = () => {
    if (isControlled && onToggle) {
      if (open) setPreOpenText("");
      onToggle();
    } else if (!isControlled) {
      setInternalOpen((p) => {
        if (p) setPreOpenText("");
        return !p;
      });
    }
  };

  const size = sizeMap[settings.sizePreset] ?? sizeMap.M;
  const edges = posEdges(settings.position);
  const fPos = flexPos(settings.position);
  const showVoice = settings.voiceEnabled;
  const [micState, setMicState] = useState<MicState>("idle");
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [launcherDraft, setLauncherDraft] = useState("");
  const [preOpenText, setPreOpenText] = useState("");
  const template = settings.layout;

  function onVoiceInput() {
    if (micState === "disabled") return;
    setMicState((prev) => (prev === "recording" ? "idle" : "recording"));
    console.log("voice input triggered");
  }

  function onPlayReply(messageId: string) {
    setPlayingMessageId((prev) => (prev === messageId ? null : messageId));
    console.log("play reply", messageId);
  }

  const baseMessages = [
    { id: "welcome", role: "assistant" as const, content: settings.welcomeMessage },
    { id: "sample-user", role: "user" as const, content: "That sounds great, tell me more!" },
    { id: "sample-bot", role: "assistant" as const, content: "Sure! Our AI captures and qualifies leads automatically around the clock." },
  ];
  const messages = preOpenText && open
    ? [{ id: "pre-open-msg", role: "user" as const, content: preOpenText }, ...baseMessages]
    : baseMessages;

  const isMono = template === "terminal" || template === "command";
  const monoFont = '"ui-monospace", "Menlo", "Consolas", monospace';

  const messageList = () => (
    <div style={{ flex: 1, overflowY: "auto", padding: template === "sheet" ? 20 : template === "bar" ? 10 : template === "terminal" ? 14 : template === "command" ? 14 : 16, background: template === "bar" ? "#fff" : template === "terminal" ? "#0d1117" : template === "command" ? "#f8fafc" : "#f8fafc" }}>
      {messages.map((msg) => {
        const isBot = msg.role === "assistant";
        const prefix = isBot && template === "terminal" ? "> " : "";
        return (
          <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isBot ? "flex-start" : "flex-end", marginBottom: template === "bar" ? 6 : template === "sheet" ? 14 : template === "terminal" ? 4 : template === "command" ? 4 : 10 }}>
            <div style={{ maxWidth: template === "terminal" ? "94%" : "82%", display: "flex", alignItems: "flex-end", gap: 6 }}>
              {isBot && showVoice && (
                <VoiceReplyButton
                  messageId={msg.id}
                  playing={playingMessageId === msg.id}
                  onClick={onPlayReply}
                  size={template === "voice" ? 30 : 26}
                />
              )}
              <div
                style={{
                  padding: template === "sheet" ? "12px 16px" : template === "bar" ? "7px 10px" : template === "terminal" ? "6px 10px" : template === "command" ? "8px 12px" : "10px 12px",
                  borderRadius: template === "bar" ? 6 : template === "sheet" ? settings.cornerRadius : template === "terminal" ? 4 : template === "command" ? 8 : settings.cornerRadius - 4,
                  fontSize: template === "sheet" ? 15 : template === "bar" ? 13 : template === "terminal" ? 13 : template === "command" ? 13 : 14,
                  fontFamily: isMono ? monoFont : undefined,
                  lineHeight: template === "terminal" ? 1.6 : 1.45,
                  overflowWrap: "anywhere",
                  background: isBot ? (template === "bar" ? "#f1f5f9" : template === "terminal" ? "#161b22" : template === "command" ? "#f1f5f9" : "#fff") : (template === "terminal" ? "#0d1117" : template === "command" ? "#1e293b" : settings.color),
                  color: isBot ? (template === "terminal" ? "#8b949e" : template === "command" ? "#334155" : "#0f172a") : (template === "terminal" ? "#58a6ff" : settings.textColor),
                  border: isBot ? (template === "terminal" ? "1px solid #30363d" : template === "command" ? "1px solid #e2e8f0" : template !== "bar" ? "1px solid rgba(15,23,42,0.08)" : "none") : "none",
                  borderBottomLeftRadius: isBot ? (template === "bar" ? 6 : template === "sheet" ? settings.cornerRadius : template === "terminal" ? 0 : template === "command" ? 8 : 4) : (template === "bar" ? 6 : settings.cornerRadius - 4),
                  borderBottomRightRadius: isBot ? (template === "bar" ? 6 : settings.cornerRadius - 4) : (template === "bar" ? 6 : template === "sheet" ? settings.cornerRadius : template === "terminal" ? 0 : template === "command" ? 8 : 4),
                }}
              >
                {template === "terminal" && isBot ? (
                  <span><span style={{ color: settings.color }}>{prefix}</span>{msg.content}</span>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const footer = !settings.showBranding ? null : (
    <footer style={{ padding: template === "bar" ? "0 10px 8px" : template === "terminal" ? "0 14px 10px" : template === "command" ? "0 14px 10px" : "0 12px 10px", background: template === "terminal" ? "#0d1117" : template === "command" ? "#ffffff" : settings.backgroundColor, textAlign: "center", color: template === "terminal" ? "#484f58" : "#64748b", fontSize: 11, fontFamily: isMono ? monoFont : undefined }}>
      Powered by LeadPilot
    </footer>
  );

  const transitionBase = reducedMotion
    ? "opacity 300ms"
    : template === "bubble" ? "opacity 220ms, transform 280ms cubic-bezier(0.34,1.56,0.64,1)"
    : template === "bar" ? "opacity 220ms, transform 260ms ease"
    : template === "voice" ? "opacity 250ms, transform 300ms cubic-bezier(0.34,1.56,0.64,1)"
    : template === "sheet" ? "opacity 250ms, transform 320ms ease-out"
    : template === "terminal" ? "opacity 280ms, transform 280ms cubic-bezier(0.16,1,0.3,1)"
    : template === "command" ? "opacity 250ms, transform 300ms ease"
    : "opacity 300ms";

  const launcherEndOpacity = 0;
  const panelStartOpacity = 0;

  const launcherHiddenTransform =
    template === "bubble" ? "scale(0.4)"
    : template === "bar" ? "translateY(-24px)"
    : template === "voice" ? "scale(1.6)"
    : template === "sheet" ? "translateY(30px)"
    : template === "terminal" ? "scale(0.3) translateY(-10px)"
    : template === "command" ? "scaleX(0.5) translateY(-12px)"
    : "scale(0.5)";

  const panelHiddenTransform =
    template === "bubble" ? "scale(0.3) translateY(24px)"
    : template === "bar" ? "scaleY(0.2)"
    : template === "voice" ? "scale(0.5)"
    : template === "sheet" ? "translateY(100%)"
    : template === "terminal" ? "scale(0.5) translateY(16px)"
    : template === "command" ? "scaleY(0.1)"
    : "scale(0.3)";

  const panelOrigin =
    template === "bubble" ? (edges.right ? "right bottom" : "left bottom")
    : template === "bar" ? (edges.bottom ? "bottom" : "top")
    : template === "voice" ? "center"
    : template === "sheet" ? (edges.bottom ? "bottom center" : "top center")
    : template === "terminal" ? "center"
    : template === "command" ? (edges.bottom ? "bottom" : "top")
    : "center";

  const launchers: Record<string, () => React.ReactNode> = {
    bubble: () => (
      <button onClick={toggle} type="button" aria-label="Open chat"
        style={{ width: 58, height: 58, border: 0, borderRadius: 9999, background: settings.color, color: settings.textColor, cursor: "pointer", boxShadow: "0 18px 42px rgba(15,23,42,0.24)", display: "grid", placeItems: "center", fontSize: 26, animation: "lp-idle-bob 3s ease-in-out infinite" }}>
        {settings.launcherIcon || chatSvg}
      </button>
    ),
    bar: () => (
      <button onClick={toggle} type="button" aria-label="Open chat"
        style={{ height: 42, padding: "0 18px", border: 0, borderRadius: 9999, background: settings.color, color: settings.textColor, cursor: "pointer", boxShadow: "0 8px 24px rgba(15,23,42,0.18)", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
        {settings.launcherIcon ? <span style={{ fontSize: 18 }}>{settings.launcherIcon}</span> : (
          <svg fill="none" height={18} viewBox="0 0 24 24" width={18}>
            <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H10l-4.2 4.2A1 1 0 0 1 4 18.5v-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        )}
        {settings.headerTitle || "Chat with us"}
      </button>
    ),
    voice: () => {
      const r = parseInt(settings.color.slice(1,3),16);
      const g = parseInt(settings.color.slice(3,5),16);
      const b = parseInt(settings.color.slice(5,7),16);
      return (
        <button onClick={toggle} type="button" aria-label="Open chat"
          style={{ width: 58, height: 58, border: 0, borderRadius: 9999, background: settings.color, color: settings.textColor, cursor: "pointer", boxShadow: "0 18px 42px rgba(15,23,42,0.24)", display: "grid", placeItems: "center", fontSize: 26, position: "relative", "--pulse-r": r, "--pulse-g": g, "--pulse-b": b } as React.CSSProperties}>
          <div style={{ position: "absolute", inset: -4, borderRadius: 9999, border: `2px solid ${settings.color}44`, animation: "lp-pulse-ring 2s ease-in-out infinite" }} />
          {settings.launcherIcon ? <span style={{ fontSize: 26 }}>{settings.launcherIcon}</span> : micSvg(26)}
        </button>
      );
    },
    sheet: () => (
      <button onClick={toggle} type="button" aria-label="Open chat"
        style={{ minWidth: 72, height: 56, padding: "0 16px", border: 0, borderRadius: 14, background: settings.color, color: settings.textColor, cursor: "pointer", boxShadow: "0 18px 42px rgba(15,23,42,0.24)", display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
        {settings.launcherIcon ? <span style={{ fontSize: 22 }}>{settings.launcherIcon}</span> : (
          <svg fill="none" height={22} viewBox="0 0 24 24" width={22}>
            <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H10l-4.2 4.2A1 1 0 0 1 4 18.5v-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        )}
        <span style={{ fontSize: 13, lineHeight: 1.2, textAlign: "left" }}>{settings.headerTitle || "Chat"}</span>
      </button>
    ),
    terminal: () => (
      <button onClick={toggle} type="button" aria-label="Open chat"
        style={{ padding: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0 }}>
        <div style={{ fontFamily: monoFont, fontSize: 11, color: "#8b949e", background: "#161b22", border: "1px solid #30363d", borderRadius: "8px 8px 8px 4px", padding: "6px 10px", maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", marginBottom: 4, textAlign: "left" }}>
          <span style={{ color: settings.color }}>$ </span>{settings.welcomeMessage.slice(0, 28)}{settings.welcomeMessage.length > 28 ? "…" : ""}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: "0 999px 999px 999px", background: settings.color, color: settings.textColor, display: "grid", placeItems: "center", fontSize: 18, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" }}>
          {settings.launcherIcon ? <span style={{ fontSize: 18 }}>{settings.launcherIcon}</span> : (
            <svg fill="none" height={20} viewBox="0 0 24 24" width={20}>
              <path d="M4 6.5A3.5 3.5 0 0 1 7.5 3h9A3.5 3.5 0 0 1 20 6.5v5A3.5 3.5 0 0 1 16.5 15H10l-4.2 4.2A1 1 0 0 1 4 18.5v-12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          )}
        </div>
      </button>
    ),
    command: () => {
      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (launcherDraft.trim()) {
          setPreOpenText(launcherDraft.trim());
          setLauncherDraft("");
          if (isControlled && onToggle) {
            if (!open) onToggle();
          } else if (!open) {
            setInternalOpen(true);
          }
        } else {
          toggle();
        }
      };
      return (
        <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", height: 48, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(15,23,42,0.12)", padding: "0 4px 0 14px", fontFamily: monoFont }}>
          <span style={{ color: "#94a3b8", fontSize: 13, marginRight: 6 }}>&gt;</span>
          <input
            autoFocus
            value={launcherDraft}
            onChange={(e) => setLauncherDraft(e.target.value)}
            placeholder="Ask us anything..."
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#0f172a", fontFamily: monoFont }}
          />
          <button type="submit" aria-label="Send"
            style={{ width: 36, height: 36, border: 0, borderRadius: 8, background: launcherDraft.trim() ? settings.color : "#e2e8f0", color: launcherDraft.trim() ? settings.textColor : "#94a3b8", cursor: "pointer", display: "grid", placeItems: "center", transition: "background 150ms" }}>
            <svg fill="none" height={16} viewBox="0 0 24 24" width={16}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
          </button>
        </form>
      );
    },
    commandbar: () => {
      const chipIcon = (name: string) => {
        const icons: Record<string, string> = { headset: "🎧", calendar: "📅", message: "💬", link: "🔗", star: "⭐", zap: "⚡" };
        return icons[name] || "💬";
      };
      const quickActions = settings.quickActions ?? [];
      const showCall = settings.callEnabled !== false;
      const showVoice = settings.voiceEnabled;
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0, width: "100%", maxWidth: 680 }}>
          <button type="button" aria-label="Toggle chat"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: 16, cursor: "pointer", color: "#94a3b8", border: 0, background: "transparent", padding: 0 }}>
            <svg fill="none" height={10} viewBox="0 0 14 14" width={10} style={{ transform: "rotate(180deg)", transition: "transform 220ms" }}>
              <path d="M11 9.5 7 5.5l-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "8px 8px 8px 14px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <span style={{ color: settings.color, fontSize: 16, flexShrink: 0 }}>✦</span>
            <input disabled placeholder="Ask us anything…" style={{ flex: 1, minWidth: 0, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "#0f172a" }} />
            {showVoice && (
              <span style={{ width: 30, height: 30, display: "grid", placeItems: "center", color: "#94a3b8" }}>
                <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              </span>
            )}
            <button type="button" aria-label="Send" disabled style={{ width: 34, height: 34, border: 0, borderRadius: 9999, background: settings.color, color: settings.textColor, display: "grid", placeItems: "center", flexShrink: 0, opacity: 0.45, cursor: "default" }}>
              <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            </button>
            {showCall && (
              <button type="button" aria-label="Call" style={{ width: 34, height: 34, border: "1px solid #e2e8f0", borderRadius: 9999, background: "transparent", color: settings.color, display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>
                <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
              </button>
            )}
          </div>
          {quickActions.length > 0 && (
            <div style={{ display: "flex", gap: 6, padding: "6px 0 4px", flexWrap: "wrap" }}>
              {quickActions.map((qa, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid #e2e8f0", borderRadius: 9999, background: "#ffffff", color: "#475569", fontSize: 11, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 12 }}>{chipIcon(qa.icon)}</span>
                  {qa.label}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    },
  };

  const headers: Record<string, () => React.ReactNode> = {
    bubble: () => (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px", background: settings.color, color: settings.textColor }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9999, background: "rgba(255,255,255,0.22)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 16, color: settings.textColor, flex: "0 0 auto" }}>
            {settings.botName.charAt(0)}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{settings.headerTitle}</p>
            <p style={{ margin: "3px 0 0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.92 }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: "#34d399", display: "inline-block" }} />
              Online
            </p>
          </div>
        </div>
        <button onClick={toggle} type="button" style={{ border: 0, background: "rgba(255,255,255,0.16)", color: settings.textColor, borderRadius: 9999, width: 32, height: 32, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "grid", placeItems: "center" }}>x</button>
      </header>
    ),
    bar: () => (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: settings.backgroundColor, color: settings.color, borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{settings.headerTitle}</span>
        <button onClick={toggle} type="button" style={{ border: 0, background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 13, padding: 4, lineHeight: 1 }}>x</button>
      </header>
    ),
    voice: () => (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px", background: settings.color, color: settings.textColor }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9999, background: "rgba(255,255,255,0.22)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 16, color: settings.textColor, flex: "0 0 auto" }}>
            {settings.botName.charAt(0)}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{settings.headerTitle}</p>
            <p style={{ margin: "3px 0 0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, opacity: 0.92 }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: "#34d399", display: "inline-block" }} />
              Online
            </p>
          </div>
        </div>
        <button onClick={toggle} type="button" style={{ border: 0, background: "rgba(255,255,255,0.16)", color: settings.textColor, borderRadius: 9999, width: 32, height: 32, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "grid", placeItems: "center" }}>x</button>
      </header>
    ),
    sheet: () => (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "20px 20px 16px", background: settings.color, color: settings.textColor }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 9999, background: "rgba(255,255,255,0.2)", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 20, color: settings.textColor, flex: "0 0 auto" }}>
            {settings.botName.charAt(0)}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{settings.headerTitle}</p>
            <p style={{ margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6, fontSize: 13, opacity: 0.92 }}>
              <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#34d399", display: "inline-block" }} />
              Online
            </p>
          </div>
        </div>
        <button onClick={toggle} type="button" style={{ border: 0, background: "rgba(255,255,255,0.16)", color: settings.textColor, borderRadius: 9999, width: 36, height: 36, cursor: "pointer", fontSize: 16, fontWeight: 600, display: "grid", placeItems: "center" }}>x</button>
      </header>
    ),
    terminal: () => (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", background: "#161b22", color: "#c9d1d9", borderBottom: "1px solid #30363d", fontFamily: monoFont }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ color: settings.color, fontSize: 13, fontWeight: 700 }}>$</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#c9d1d9" }}>{settings.headerTitle}</span>
        </div>
        <button onClick={toggle} type="button" style={{ border: 0, background: "transparent", color: "#8b949e", cursor: "pointer", fontSize: 14, padding: 2, lineHeight: 1 }}>x</button>
      </header>
    ),
    command: () => (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", background: "#ffffff", color: "#0f172a", borderBottom: "1px solid #e2e8f0", fontFamily: monoFont }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ color: settings.color, fontSize: 13, fontWeight: 700 }}>&gt;</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{settings.headerTitle}</span>
        </div>
        <button onClick={toggle} type="button" style={{ border: 0, background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: 2, lineHeight: 1 }}>x</button>
      </header>
    ),
    commandbar: () => (
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{settings.headerTitle}</span>
        <button onClick={toggle} type="button" style={{ border: 0, background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 14, padding: 2, lineHeight: 1 }}>x</button>
      </header>
    ),
  };

  const composers: Record<string, () => React.ReactNode> = {
    bubble: () => (
      <div style={{ display: "grid", gridTemplateColumns: showVoice ? "auto 1fr auto" : "1fr auto", gap: 8, padding: "12px", borderTop: "1px solid rgba(15,23,42,0.08)", background: settings.backgroundColor }}>
        {showVoice && <MicButton state={micState} onClick={onVoiceInput} />}
        <input disabled placeholder="Type your message..." style={{ minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 9999, padding: "11px 16px", fontSize: 14, outline: "none", background: settings.backgroundColor }} />
        <button disabled style={{ border: 0, borderRadius: 9999, background: settings.color, color: settings.textColor, width: 42, height: 42, display: "grid", placeItems: "center", cursor: "default", opacity: 0.55 }}>
          <svg fill="none" height={18} viewBox="0 0 24 24" width={18}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        </button>
      </div>
    ),
    bar: () => (
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderTop: "1px solid rgba(15,23,42,0.06)", background: settings.backgroundColor }}>
        {showVoice && <MicButton state={micState} onClick={onVoiceInput} size={26} />}
        <input disabled placeholder="Message..." style={{ flex: 1, minWidth: 0, border: "none", padding: "7px 4px", fontSize: 13, outline: "none", background: "transparent" }} />
        <button disabled style={{ border: 0, borderRadius: 6, background: settings.color, color: settings.textColor, padding: "0 10px", height: 28, fontWeight: 600, cursor: "default", opacity: 0.55, fontSize: 12 }}>Send</button>
      </div>
    ),
    voice: () => (
      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid rgba(15,23,42,0.08)", background: settings.backgroundColor, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        {showVoice && <MicButton state={micState} onClick={onVoiceInput} size={56} />}
        <div style={{ display: "flex", gap: 8, width: "100%" }}>
          <input disabled placeholder="Type or speak..." style={{ flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: 12, padding: "9px 12px", fontSize: 13, outline: "none", background: settings.backgroundColor }} />
          <button disabled style={{ border: 0, borderRadius: 12, background: settings.color, color: settings.textColor, padding: "0 14px", fontWeight: 700, cursor: "default", opacity: 0.55, fontSize: 13 }}>Send</button>
        </div>
      </div>
    ),
    sheet: () => (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px 18px", borderTop: "1px solid rgba(15,23,42,0.08)", background: settings.backgroundColor }}>
        {showVoice && <MicButton state={micState} onClick={onVoiceInput} size={38} />}
        <input disabled placeholder="Type your message..." style={{ flex: 1, minWidth: 0, border: "1px solid #cbd5e1", borderRadius: settings.cornerRadius, padding: "12px 14px", fontSize: 15, outline: "none", background: settings.backgroundColor }} />
        <button disabled style={{ border: 0, borderRadius: settings.cornerRadius, background: settings.color, color: settings.textColor, padding: "0 20px", height: 44, fontWeight: 700, cursor: "default", opacity: 0.55, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
          {showVoice ? micSvg(16) : null}
          Send
        </button>
      </div>
    ),
    terminal: () => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid #30363d", background: "#0d1117", fontFamily: monoFont }}>
        <span style={{ color: settings.color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>+ </span>
        {showVoice && <MicButton state={micState} onClick={onVoiceInput} size={24} />}
        <input disabled placeholder="Type a command..." style={{ flex: 1, minWidth: 0, border: "none", padding: "6px 0", fontSize: 13, outline: "none", background: "transparent", color: "#c9d1d9", fontFamily: monoFont }} />
        <span style={{ width: 7, height: 14, background: settings.color, animation: "lp-blink-cursor 1s step-end infinite", flexShrink: 0 }} />
      </div>
    ),
    command: () => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderTop: "1px solid #e2e8f0", background: "#ffffff", fontFamily: monoFont }}>
        <span style={{ color: settings.color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>&gt;</span>
        {showVoice && <MicButton state={micState} onClick={onVoiceInput} size={24} />}
        <input disabled placeholder="Type a message..." style={{ flex: 1, minWidth: 0, border: "none", padding: "6px 0", fontSize: 13, outline: "none", background: "transparent", color: "#0f172a", fontFamily: monoFont }} />
        <button disabled style={{ border: 0, borderRadius: 8, background: settings.color, color: settings.textColor, padding: "0 12px", height: 30, fontWeight: 600, cursor: "default", opacity: 0.55, fontSize: 12, fontFamily: monoFont }}>Send</button>
      </div>
    ),
    commandbar: () => null,
  };

  const panels: Record<string, () => React.ReactNode> = {
    bubble: () => (
      <div style={{ width: size.w, maxWidth: "100%", height: size.h, maxHeight: "100%", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(15,23,42,0.12)", borderRadius: settings.cornerRadius, background: settings.backgroundColor, boxShadow: "0 24px 80px rgba(15,23,42,0.22)" }}>
        {headers.bubble()}
        {messageList()}
        {composers.bubble()}
        {footer}
      </div>
    ),
    bar: () => (
      <div style={{ width: size.w, maxWidth: "100%", height: size.h, maxHeight: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: settings.backgroundColor, boxShadow: "0 24px 80px rgba(15,23,42,0.18)", borderRadius: 0 }}>
        {headers.bar()}
        {messageList()}
        {composers.bar()}
        {footer}
      </div>
    ),
    voice: () => (
      <div style={{ width: size.w, maxWidth: "100%", height: size.h, maxHeight: "100%", display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(15,23,42,0.12)", borderRadius: settings.cornerRadius, background: settings.backgroundColor, boxShadow: "0 24px 80px rgba(15,23,42,0.22)" }}>
        {headers.voice()}
        {messageList()}
        {composers.voice()}
        {footer}
      </div>
    ),
    sheet: () => (
      <div style={{ width: Math.max(size.w, 380), maxWidth: "100%", height: Math.max(size.h, 520), maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", background: settings.backgroundColor, boxShadow: "0 -12px 60px rgba(15,23,42,0.18)", borderRadius: `${settings.cornerRadius}px ${settings.cornerRadius}px 0 0` }}>
        {headers.sheet()}
        {messageList()}
        {composers.sheet()}
        {footer}
      </div>
    ),
    terminal: () => (
      <div style={{ width: Math.min(size.w + 40, 480), maxWidth: "90vw", height: Math.min(size.h, 540), maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#0d1117", border: "1px solid #30363d", borderRadius: 10, boxShadow: "0 24px 80px rgba(0,0,0,0.6)", fontFamily: monoFont }}>
        {headers.terminal()}
        {messageList()}
        {composers.terminal()}
        {footer}
      </div>
    ),
    command: () => (
      <div style={{ width: size.w, maxWidth: "100%", height: size.h, maxHeight: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 24px 80px rgba(15,23,42,0.18)", fontFamily: monoFont }}>
        {headers.command()}
        {messageList()}
        {composers.command()}
        {footer}
      </div>
    ),
    commandbar: () => (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px 14px 0 0", boxShadow: "0 -8px 32px rgba(0,0,0,0.08)", maxHeight: Math.min(size.h, 480) }}>
        {headers.commandbar()}
        {messageList()}
        {footer}
      </div>
    ),
  };

  if (showBoth) {
    return (
      <>
        <style>{keyframesStyle}</style>
        <div style={{ position: "relative", width: "100%", height: "100%", fontFamily: settings.fontFamily, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0 }}>
            <div style={{ transform: "scale(0.55)", transformOrigin: "top left" }}>
              {panels[template]?.()}
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 6, right: 6, zIndex: 1, transform: "scale(0.85)", transformOrigin: "bottom right" }}>
            {launchers[template]?.()}
          </div>
        </div>
      </>
    );
  }

  if (template === "terminal") {
    return (
      <>
        <style>{keyframesStyle}</style>
        <div style={{ position: "relative", width: "100%", height: "100%", fontFamily: settings.fontFamily }}>
          <div style={{ display: "flex", justifyContent: fPos.justifyContent, alignItems: fPos.alignItems, width: "100%", height: "100%", position: "absolute", inset: 0 }}>
            <div style={{ opacity: open ? 0 : 1, transform: open ? "scale(0.3) translateY(-10px)" : "none", transition: transitionBase, pointerEvents: open ? "none" : "auto" }}>
              {launchers.terminal()}
            </div>
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 250ms", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", zIndex: 10 }}>
            <div style={{ transform: open ? "none" : "scale(0.5) translateY(16px)", transition: transitionBase, transformOrigin: "center" }}>
              {panels.terminal()}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (template === "commandbar") {
    return (
      <>
        <style>{keyframesStyle}</style>
        <div style={{ position: "relative", width: "100%", height: "100%", fontFamily: settings.fontFamily, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ width: "100%", maxWidth: 680, opacity: open ? 1 : 0, transform: open ? "translateY(0)" : "translateY(16px)", transition: transitionBase, pointerEvents: open ? "auto" : "none" }}>
            {panels.commandbar()}
          </div>
          <div style={{ width: "100%", maxWidth: 680, opacity: 1, transform: "none", transition: transitionBase }}>
            {launchers.commandbar()}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{keyframesStyle}</style>
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: fPos.justifyContent,
          alignItems: fPos.alignItems,
          fontFamily: settings.fontFamily,
        }}
      >
        <div
          style={{
            opacity: open ? launcherEndOpacity : 1,
            transform: open ? launcherHiddenTransform : "none",
            transition: transitionBase,
            pointerEvents: open ? "none" : "auto",
          }}
        >
          {launchers[template]?.()}
        </div>

        <div
          style={{
            position: "absolute",
            [edges.right ? "right" : "left"]: 0,
            [edges.bottom ? "bottom" : "top"]: 0,
            opacity: open ? 1 : panelStartOpacity,
            transform: open ? "none" : panelHiddenTransform,
            transformOrigin: panelOrigin,
            transition: transitionBase,
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {panels[template]?.()}
        </div>
      </div>
    </>
  );
}
