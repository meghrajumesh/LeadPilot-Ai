"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

type WidgetSettingsFormProps = {
  projectId: string;
  initialConfig: {
    color: string;
    botName: string;
    welcomeMessage: string;
    avatarUrl: string;
  };
  initialDomains: string[];
};

export function WidgetSettingsForm({ projectId, initialConfig, initialDomains }: WidgetSettingsFormProps) {
  const router = useRouter();
  const [color, setColor] = useState(initialConfig.color);
  const [botName, setBotName] = useState(initialConfig.botName);
  const [welcomeMessage, setWelcomeMessage] = useState(initialConfig.welcomeMessage);
  const [avatarUrl, setAvatarUrl] = useState(initialConfig.avatarUrl);
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [domainInput, setDomainInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          widgetConfig: { color, botName, welcomeMessage, avatarUrl },
          allowedDomains: domains
        })
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
    <form className="space-y-6" onSubmit={onSubmit}>
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
        <h2 className="text-lg font-bold text-[#111827]">Appearance</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Customize the look and feel of your chat widget.</p>
        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="color">Brand Color</Label>
            <div className="flex gap-3">
              <Input
                id="color"
                onChange={(e) => setColor(e.target.value)}
                placeholder="#2563eb"
                value={color}
              />
              <input
                className="h-10 w-10 cursor-pointer rounded-md border"
                onChange={(e) => setColor(e.target.value)}
                type="color"
                value={color}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="botName">Bot Name</Label>
            <Input
              id="botName"
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Ava"
              value={botName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <textarea
              className="min-h-24 w-full rounded-md border border-[#D1D5DB] px-3 py-2 text-sm"
              id="welcomeMessage"
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Hi! How can I help you today?"
              value={welcomeMessage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
            <Input
              id="avatarUrl"
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              value={avatarUrl}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
        <h2 className="text-lg font-bold text-[#111827]">Allowed Domains</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Restrict which websites can embed your widget. Add domain names (e.g. example.com). Localhost is always allowed for testing.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {domains.length === 0 ? (
            <span className="rounded-md bg-[#FEF3C7] px-3 py-1.5 text-sm text-[#92400E]">
              No domains configured — widget will not work until you add at least one domain.
            </span>
          ) : (
            domains.map((domain) => (
              <span
                className="inline-flex items-center gap-1.5 rounded-md bg-[#EDE9FE] px-3 py-1.5 text-sm text-[#7C3AED]"
                key={domain}
              >
                {domain}
                <button
                  className="hover:text-[#5B21B6]"
                  onClick={() => removeDomain(domain)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDomain(); } }}
            placeholder="example.com"
            value={domainInput}
          />
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#374151] hover:bg-[#F9FAFB]"
            onClick={addDomain}
            type="button"
          >
            Add
          </button>
        </div>
      </section>

      {message ? (
        <p
          className={
            message.type === "success"
              ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-[#059669]"
              : "rounded-lg bg-red-50 px-3 py-2 text-sm text-[#EF4444]"
          }
        >
          {message.text}
        </p>
      ) : null}

      <Button
        className="h-11 rounded-lg bg-[#7C3AED] px-6 font-semibold text-white hover:bg-[#5B21B6]"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
