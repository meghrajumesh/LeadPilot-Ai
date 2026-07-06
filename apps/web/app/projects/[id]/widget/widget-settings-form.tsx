"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TemplateGallery } from "@/components/widget/template-gallery";
import { CastingPreviewOverlay } from "@/components/widget/casting-preview-overlay";
import { X } from "lucide-react";

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
  callEnabled?: boolean;
  quickActions?: { label: string; icon: string; action: string; value: string }[];
};

type WidgetSettingsFormProps = {
  projectId: string;
  initialSettings: WidgetSettingsData;
  initialDomains: string[];
};

const FONT_OPTIONS = [
  "Inter",
  "System UI",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
];

const POSITION_OPTIONS = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
];

const LAYOUT_OPTIONS = [
  { value: "bubble", label: "Bubble", desc: "Round launcher, rounded card, friendly bubbles." },
  { value: "bar", label: "Bar", desc: "Slim pill launcher, flat panel, squared minimal." },
  { value: "voice", label: "Voice", desc: "Mic launcher, large centered mic, speaker buttons." },
  { value: "terminal", label: "Terminal", desc: "Peeking preview bubble, dark center-modal console." },
  { value: "command", label: "Command", desc: "Type-into launcher bar, expand-to-panel chat." },
  { value: "commandbar", label: "Command Bar", desc: "Persistent docked bar with chips, call button, expandable panel." },
];

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function WidgetSettingsForm({ projectId, initialSettings, initialDomains }: WidgetSettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<WidgetSettingsData>(initialSettings);
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [domainInput, setDomainInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  function update<K extends keyof WidgetSettingsData>(key: K, value: WidgetSettingsData[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function addDomain() {
    const trimmed = domainInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!trimmed) return;
    if (domains.includes(trimmed)) return;
    setDomains([...domains, trimmed]);
    setDomainInput("");
  }

  function removeDomain(domain: string) {
    setDomains(domains.filter((d) => d !== domain));
  }

  function resetDefaults() {
    setSettings({
      color: "#2563eb",
      botName: "LeadPilot",
      welcomeMessage: "Hi! How can I help you today?",
      avatarUrl: "",
      textColor: "#ffffff",
      backgroundColor: "#ffffff",
      position: "bottom-right",
      launcherShape: "round",
      launcherIcon: "",
      headerTitle: "Chat with us",
      cornerRadius: 18,
      sizePreset: "M",
      showBranding: true,
      fontFamily: "Inter",
      layout: "bubble",
      voiceEnabled: true,
      callEnabled: true,
      quickActions: [
        { label: "Speak to Sales", icon: "headset", action: "sendMessage", value: "I'd like to speak to sales" },
        { label: "Book a Demo", icon: "calendar", action: "link", value: "https://example.com/demo" },
      ],
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetConfig: {
            color: settings.color,
            botName: settings.botName,
            welcomeMessage: settings.welcomeMessage,
            avatarUrl: settings.avatarUrl,
            textColor: settings.textColor,
            backgroundColor: settings.backgroundColor,
            position: settings.position,
            launcherShape: settings.launcherShape,
            launcherIcon: settings.launcherIcon,
            headerTitle: settings.headerTitle,
            cornerRadius: settings.cornerRadius,
            sizePreset: settings.sizePreset,
            showBranding: settings.showBranding,
            fontFamily: settings.fontFamily,
            layout: settings.layout,
            voiceEnabled: settings.voiceEnabled,
            callEnabled: settings.callEnabled ?? true,
            quickActions: settings.quickActions ?? [],
          },
          allowedDomains: domains,
        }),
      });

      const payload = await response.json();

      if (!payload.success) {
        setMessage({ type: "error", text: payload.error ?? "Could not save settings." });
        return;
      }

      setMessage({ type: "success", text: "Settings saved successfully." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Could not save settings." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full lg:w-[30%] lg:self-start">
          <div
            className="flex flex-col lg:sticky lg:top-20"
            style={{ height: "calc(100vh - 5rem)" }}
          >
            <div className="flex-1 overflow-y-auto min-h-0 px-4">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#D1D5DB] bg-white px-4 py-3 text-sm font-semibold text-[#374151] shadow-sm transition hover:bg-[#F9FAFB]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview Widget
              </button>

              <form id="widget-settings-form" className="space-y-4" onSubmit={onSubmit}>
            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Colors</h2>
              <div className="mt-3 space-y-3">
                <ColorField id="color" label="Primary" value={settings.color} onChange={(v) => update("color", v)} />
                <ColorField id="textColor" label="Header Text" value={settings.textColor} onChange={(v) => update("textColor", v)} />
                <ColorField id="backgroundColor" label="Panel BG" value={settings.backgroundColor} onChange={(v) => update("backgroundColor", v)} />
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Position</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {POSITION_OPTIONS.map((opt) => {
                  const selected = settings.position === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update("position", opt.value)}
                      className={cn(
                        "rounded-lg border-2 px-3 py-2 text-xs font-medium transition",
                        selected
                          ? "border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]"
                          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Layout Style</h2>
              <p className="mt-1 text-[10px] text-[#6B7280]">Changes structure without resetting colors or content.</p>
              <div className="mt-3 space-y-2">
                {LAYOUT_OPTIONS.map((opt) => {
                  const selected = settings.layout === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update("layout", opt.value)}
                      className={cn(
                        "w-full rounded-lg border-2 px-3 py-2 text-left text-xs font-medium transition",
                        selected
                          ? "border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]"
                          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]"
                      )}
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="ml-1 font-normal text-[#6B7280]">— {opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Display</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="text-xs">Launcher Shape</Label>
                  <div className="mt-1 flex gap-2">
                    {["round", "square"].map((shape) => {
                      const selected = settings.launcherShape === shape;
                      return (
                        <button
                          key={shape}
                          type="button"
                          onClick={() => update("launcherShape", shape)}
                          className={cn(
                            "flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium capitalize transition",
                            selected
                              ? "border-[#7C3AED] bg-[#EDE9FE] text-[#7C3AED]"
                              : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#D1D5DB]"
                          )}
                        >
                          {shape === "round" ? "● Round" : "■ Square"}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="text-xs" htmlFor="sizePreset">Size</Label>
                  <select
                    id="sizePreset"
                    value={settings.sizePreset}
                    onChange={(e) => update("sizePreset", e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="S">Small (320x500)</option>
                    <option value="M">Medium (380x620)</option>
                    <option value="L">Large (440x720)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs" htmlFor="cornerRadius">Radius ({settings.cornerRadius}px)</Label>
                  <input
                    id="cornerRadius"
                    type="range"
                    min="4"
                    max="32"
                    value={settings.cornerRadius}
                    onChange={(e) => update("cornerRadius", Number(e.target.value))}
                    className="mt-1 w-full"
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor="fontFamily">Font</Label>
                  <select
                    id="fontFamily"
                    value={settings.fontFamily}
                    onChange={(e) => update("fontFamily", e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs" htmlFor="launcherIcon">Icon (emoji)</Label>
                  <Input
                    id="launcherIcon"
                    onChange={(e) => update("launcherIcon", e.target.value)}
                    placeholder="e.g. 💬"
                    value={settings.launcherIcon}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Content</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="text-xs" htmlFor="headerTitle">Header Title</Label>
                  <Input
                    id="headerTitle"
                    onChange={(e) => update("headerTitle", e.target.value)}
                    placeholder="Chat with us"
                    value={settings.headerTitle}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor="botName">Bot Name</Label>
                  <Input
                    id="botName"
                    onChange={(e) => update("botName", e.target.value)}
                    placeholder="LeadPilot"
                    value={settings.botName}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor="welcomeMessage">Welcome Message</Label>
                  <textarea
                    className="mt-1 min-h-20 w-full rounded-md border border-[#D1D5DB] px-3 py-2 text-xs"
                    id="welcomeMessage"
                    onChange={(e) => update("welcomeMessage", e.target.value)}
                    placeholder="Hi! How can I help you today?"
                    value={settings.welcomeMessage}
                  />
                </div>
                <div>
                  <Label className="text-xs" htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    onChange={(e) => update("avatarUrl", e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    value={settings.avatarUrl}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Toggles</h2>
              <div className="mt-3 space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#111827]">Show Branding</p>
                    <p className="text-[10px] text-[#6B7280]">Show &ldquo;Powered by LeadPilot&rdquo;</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.showBranding}
                    onClick={() => update("showBranding", !settings.showBranding)}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      settings.showBranding ? "bg-[#7C3AED]" : "bg-[#D1D5DB]"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        settings.showBranding ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#111827]">Voice Enabled</p>
                    <p className="text-[10px] text-[#6B7280]">Show mic + speaker controls in widget</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.voiceEnabled}
                    onClick={() => update("voiceEnabled", !settings.voiceEnabled)}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      settings.voiceEnabled ? "bg-[#7C3AED]" : "bg-[#D1D5DB]"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        settings.voiceEnabled ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#111827]">Call Button</p>
                    <p className="text-[10px] text-[#6B7280]">Show call button in command bar (commandbar layout)</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.callEnabled ?? true}
                    onClick={() => update("callEnabled", !(settings.callEnabled ?? true))}
                    className={cn(
                      "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                      (settings.callEnabled ?? true) ? "bg-[#7C3AED]" : "bg-[#D1D5DB]"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        (settings.callEnabled ?? true) ? "translate-x-4" : "translate-x-0"
                      )}
                    />
                  </button>
                </label>
              </div>
            </section>

            {settings.layout === "commandbar" && (
              <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
                <h2 className="text-base font-bold text-[#111827]">Quick Actions</h2>
                <p className="mt-1 text-[10px] text-[#6B7280]">Chips shown below the command bar. Only relevant for the Command Bar layout.</p>
                <div className="mt-3 space-y-3">
                  {(settings.quickActions ?? []).map((qa, i) => (
                    <div key={i} className="space-y-2 rounded-lg border border-[#E5E7EB] p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#6B7280]">Chip {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(settings.quickActions ?? [])];
                            list.splice(i, 1);
                            update("quickActions", list);
                          }}
                          className="text-[10px] text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px]">Label</Label>
                          <input
                            className="mt-0.5 flex h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none"
                            value={qa.label}
                            onChange={(e) => {
                              const list = [...(settings.quickActions ?? [])];
                              list[i] = { ...list[i], label: e.target.value };
                              update("quickActions", list);
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px]">Icon</Label>
                          <select
                            className="mt-0.5 flex h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none"
                            value={qa.icon}
                            onChange={(e) => {
                              const list = [...(settings.quickActions ?? [])];
                              list[i] = { ...list[i], icon: e.target.value };
                              update("quickActions", list);
                            }}
                          >
                            <option value="headset">🎧 Headset</option>
                            <option value="calendar">📅 Calendar</option>
                            <option value="message">💬 Message</option>
                            <option value="link">🔗 Link</option>
                            <option value="star">⭐ Star</option>
                            <option value="zap">⚡ Zap</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px]">Action</Label>
                          <select
                            className="mt-0.5 flex h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none"
                            value={qa.action}
                            onChange={(e) => {
                              const list = [...(settings.quickActions ?? [])];
                              list[i] = { ...list[i], action: e.target.value };
                              update("quickActions", list);
                            }}
                          >
                            <option value="sendMessage">Send Message</option>
                            <option value="link">Open Link</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-[10px]">{qa.action === "link" ? "URL" : "Message"}</Label>
                          <input
                            className="mt-0.5 flex h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] outline-none"
                            value={qa.value}
                            onChange={(e) => {
                              const list = [...(settings.quickActions ?? [])];
                              list[i] = { ...list[i], value: e.target.value };
                              update("quickActions", list);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const list = [...(settings.quickActions ?? [])];
                      list.push({ label: "", icon: "message", action: "sendMessage", value: "" });
                      update("quickActions", list);
                    }}
                    className="w-full rounded-lg border-2 border-dashed border-[#D1D5DB] py-2 text-xs font-medium text-[#6B7280] hover:border-[#7C3AED] hover:text-[#7C3AED] transition"
                  >
                    + Add Chip
                  </button>
                </div>
              </section>
            )}

            <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E5E7EB]">
              <h2 className="text-base font-bold text-[#111827]">Allowed Domains</h2>
              <p className="mt-1 text-[10px] text-[#6B7280]">
                Restrict which sites can embed the widget.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {domains.length === 0 ? (
                  <span className="rounded-md bg-[#FEF3C7] px-2 py-1 text-[10px] text-[#92400E]">
                    Add at least one domain
                  </span>
                ) : (
                  domains.map((domain) => (
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-[#EDE9FE] px-2 py-1 text-[10px] text-[#7C3AED]"
                      key={domain}
                    >
                      {domain}
                      <button
                        className="hover:text-[#5B21B6]"
                        onClick={() => removeDomain(domain)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDomain(); } }}
                  placeholder="example.com"
                  value={domainInput}
                  className="h-8 text-xs"
                />
                <button
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white px-3 py-1 text-xs font-semibold text-[#374151] hover:bg-[#F9FAFB]"
                  onClick={addDomain}
                  type="button"
                >
                  Add
                </button>
              </div>
            </section>
          </form>
        </div>

        <div className="flex-shrink-0 border-t border-[#E5E7EB] bg-white px-4 pb-4 pt-3">
          {message ? (
            <p
              className={
                message.type === "success"
                  ? "mb-3 rounded-lg bg-green-50 px-3 py-2 text-xs text-[#059669]"
                  : "mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#EF4444]"
              }
            >
              {message.text}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button
              className="h-9 rounded-lg bg-[#7C3AED] px-4 text-xs font-semibold text-white hover:bg-[#5B21B6]"
              disabled={isLoading}
              type="submit"
              form="widget-settings-form"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              className="h-9 rounded-lg border border-[#D1D5DB] bg-[#F3F4F6] px-4 text-xs font-semibold text-[#374151] hover:bg-[#E5E7EB]"
              type="button"
              onClick={resetDefaults}
              disabled={isLoading}
            >
              Reset
            </Button>
          </div>
          </div>
        </div>
      </div>

        <div className="w-full lg:w-[70%]">
          <TemplateGallery onSelect={(templateSettings) => setSettings(templateSettings)} />
        </div>
      </div>

      {showPreview && (
        <CastingPreviewOverlay
          settings={settings}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs" htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <input
          id={id}
          className="flex h-8 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          value={value}
        />
        <input
          className="h-8 w-8 cursor-pointer rounded-md border"
          onChange={(e) => onChange(e.target.value)}
          type="color"
          value={value}
        />
      </div>
    </div>
  );
}
