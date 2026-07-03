"use client";

import { useState } from "react";
import { WidgetPreview } from "@/components/widget/widget-preview";
import { CastingPreviewOverlay } from "@/components/widget/casting-preview-overlay";

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

type Template = {
  id: string;
  name: string;
  description: string;
  settings: WidgetSettingsData;
};

const TEMPLATES: Template[] = [
  {
    id: "bubble",
    name: "Bubble",
    description: "Round floating button with a chat icon, rounded card panel, soft bubble messages. Friendly conversational feel.",
    settings: {
      color: "#2563eb",
      textColor: "#ffffff",
      backgroundColor: "#ffffff",
      avatarUrl: "",
      position: "bottom-right",
      launcherShape: "round",
      launcherIcon: "",
      headerTitle: "Chat with us",
      welcomeMessage: "Hi! How can I help you today?",
      botName: "LeadPilot",
      cornerRadius: 18,
      sizePreset: "M",
      showBranding: true,
      fontFamily: "Inter",
      layout: "bubble",
      voiceEnabled: true,
    },
  },
  {
    id: "bar",
    name: "Bar",
    description: "Slim pill bar docked to the edge, flat borderless panel, squared corners, tight rows. Sleek and minimal.",
    settings: {
      color: "#111827",
      textColor: "#ffffff",
      backgroundColor: "#ffffff",
      avatarUrl: "",
      position: "bottom-right",
      launcherShape: "round",
      launcherIcon: "",
      headerTitle: "Chat",
      welcomeMessage: "Hi! How can I help you today?",
      botName: "LP",
      cornerRadius: 8,
      sizePreset: "M",
      showBranding: false,
      fontFamily: "Inter",
      layout: "bar",
      voiceEnabled: true,
    },
  },
  {
    id: "voice",
    name: "Voice",
    description: "Circular mic launcher with pulse ring, large centered mic in composer, prominent speaker buttons. Voice-first.",
    settings: {
      color: "#059669",
      textColor: "#ffffff",
      backgroundColor: "#ffffff",
      avatarUrl: "",
      position: "bottom-right",
      launcherShape: "round",
      launcherIcon: "",
      headerTitle: "Chat with us",
      welcomeMessage: "Hi! How can I help you today?",
      botName: "LeadPilot",
      cornerRadius: 18,
      sizePreset: "M",
      showBranding: true,
      fontFamily: "Inter",
      layout: "voice",
      voiceEnabled: true,
    },
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "Speech-bubble launcher with a peeking preview line, dark monospace center-modal chat. Developer console aesthetic.",
    settings: {
      color: "#58a6ff",
      textColor: "#ffffff",
      backgroundColor: "#0d1117",
      avatarUrl: "",
      position: "bottom-right",
      launcherShape: "round",
      launcherIcon: "",
      headerTitle: "Console Chat",
      welcomeMessage: "System ready. How can I help?",
      botName: "LP",
      cornerRadius: 10,
      sizePreset: "M",
      showBranding: true,
      fontFamily: '"ui-monospace", "Menlo", "Consolas", monospace',
      layout: "terminal",
      voiceEnabled: true,
    },
  },
  {
    id: "command",
    name: "Command",
    description: "Type-into launcher bar that expands into a chat panel. Clean monospace, techy and fast.",
    settings: {
      color: "#1e293b",
      textColor: "#ffffff",
      backgroundColor: "#ffffff",
      avatarUrl: "",
      position: "bottom-right",
      launcherShape: "round",
      launcherIcon: "",
      headerTitle: "Command",
      welcomeMessage: "Ready for your command.",
      botName: "LP",
      cornerRadius: 12,
      sizePreset: "M",
      showBranding: true,
      fontFamily: '"ui-monospace", "Menlo", "Consolas", monospace',
      layout: "command",
      voiceEnabled: true,
    },
  },
];

type TemplateGalleryProps = {
  onSelect: (settings: WidgetSettingsData) => void;
};

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  return (
    <>
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#E5E7EB]">
        <div className="mb-1">
          <h2 className="text-lg font-bold text-[#111827]">Template Gallery</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Choose a layout structure, then customize colors and content before saving.
          </p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelect(template.settings)}
              onPreview={() => setPreviewTemplate(template)}
            />
          ))}
        </div>
      </div>

      {previewTemplate && (
        <CastingPreviewOverlay
          settings={previewTemplate.settings}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  );
}

function TemplateCard({
  template,
  onSelect,
  onPreview,
}: {
  template: Template;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm transition hover:shadow-md"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative h-48 overflow-hidden bg-[#f6f7fb]">
        <WidgetPreview
          settings={template.settings}
          showBoth
        />
      </div>
      <div className="px-4 pb-2 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#111827]">{template.name}</span>
          <div className={`flex gap-2 transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
            <button
              type="button"
              onClick={onSelect}
              className="rounded-md bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#5B21B6]"
            >
              Select
            </button>
            <button
              type="button"
              onClick={onPreview}
              className="rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] transition hover:bg-[#F9FAFB]"
            >
              Preview
            </button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-[#6B7280]">{template.description}</p>
      </div>
    </div>
  );
}
