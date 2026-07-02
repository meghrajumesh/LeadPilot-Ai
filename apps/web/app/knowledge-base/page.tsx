"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, FileText, FileUp, Trash2, Loader2 } from "lucide-react";

type KnowledgeDoc = {
  id: string;
  title: string;
  content?: string;
  source_ref?: string;
  chunkCount: number;
  createdAt: string;
};

type Project = {
  id: string;
  name: string;
};

type Tab = "website" | "file" | "text";

const tabs: { key: Tab; label: string; icon: typeof Globe }[] = [
  { key: "website", label: "Website", icon: Globe },
  { key: "file", label: "File", icon: FileUp },
  { key: "text", label: "Text", icon: FileText },
];

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("website");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.projects)) {
          setProjects(json.data.projects.map((p: any) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setDocs([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/knowledge?projectId=${encodeURIComponent(selectedProjectId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.success) setDocs(json.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedProjectId, refreshKey]);

  function flash(msg: string, type: "success" | "error" = "success") {
    setMessage({ type, text: msg });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleScrape(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !selectedProjectId) return;
    setScraping(true);
    setMessage(null);
    try {
      const res = await fetch("/api/kb/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: url.trim(),
          url: url.trim(),
          source: "website",
          sourceRef: url.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        flash(`Website added (${json.chunksAdded} chunks)`);
        setUrl("");
        setRefreshKey((k) => k + 1);
      } else {
        flash(json.error ?? "Scrape failed", "error");
      }
    } catch {
      flash("Failed to scrape website", "error");
    }
    setScraping(false);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedProjectId) return;
    setUploading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("projectId", selectedProjectId);
      const res = await fetch("/api/knowledge/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        flash(`File "${json.data.title}" added (${json.data.chunkCount} chunks)`);
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        setRefreshKey((k) => k + 1);
      } else {
        flash(json.error ?? "Upload failed", "error");
      }
    } catch {
      flash("Failed to upload file", "error");
    }
    setUploading(false);
  }

  async function handleAddText(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !selectedProjectId) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/kb/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: title.trim(),
          content: content.trim(),
          source: "text",
          sourceRef: title.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        flash(`Document added (${json.chunksAdded} chunks)`);
        setTitle("");
        setContent("");
        setRefreshKey((k) => k + 1);
      } else {
        flash(json.error ?? "Failed to add", "error");
      }
    } catch {
      flash("Failed to add document", "error");
    }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document from the knowledge base?")) return;
    setDeleting(id);
    try {
      const res = await fetch(
        `/api/knowledge?projectId=${encodeURIComponent(selectedProjectId)}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        flash("Document deleted");
        setRefreshKey((k) => k + 1);
      }
    } catch {
      flash("Failed to delete", "error");
    }
    setDeleting(null);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add your company data — website URLs, documents, or custom text. The chatbot uses this to answer visitor questions.
          </p>
        </div>

        {message && (
          <div className={`rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="project-select">Project</Label>
          <select
            id="project-select"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Select a project...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProjectId && (
          <>
            <Card>
              <div className="flex border-b">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                      activeTab === t.key
                        ? "border-b-2 border-indigo-600 text-indigo-700"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </div>
              <CardContent className="p-5">
                {activeTab === "website" && (
                  <form className="space-y-3" onSubmit={handleScrape}>
                    <div className="space-y-1.5">
                      <Label htmlFor="url">Website URL</Label>
                      <Input
                        id="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      The page content will be fetched, chunked, and embedded into the RAG store.
                    </p>
                    <Button disabled={scraping || !url.trim()} type="submit">
                      {scraping ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Scraping...</> : "Scrape & Add"}
                    </Button>
                  </form>
                )}

                {activeTab === "file" && (
                  <form className="space-y-3" onSubmit={handleUpload}>
                    <div className="space-y-1.5">
                      <Label htmlFor="file">Upload file</Label>
                      <Input
                        ref={fileRef}
                        id="file"
                        type="file"
                        accept=".txt,.md,.pdf,.html,.csv"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Supports TXT, Markdown, PDF, HTML, and CSV files. Text is extracted and embedded.
                    </p>
                    <Button disabled={uploading || !file} type="submit">
                      {uploading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading...</> : "Upload & Embed"}
                    </Button>
                    {file && (
                      <p className="text-sm text-slate-600">
                        Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </form>
                )}

                {activeTab === "text" && (
                  <form className="space-y-3" onSubmit={handleAddText}>
                    <div className="space-y-1.5">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g. Product Pricing"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="content">Content</Label>
                      <textarea
                        id="content"
                        className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Type or paste your company information here..."
                        rows={6}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                    <Button disabled={adding || !title.trim() || !content.trim()} type="submit">
                      {adding ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Adding...</> : "Add to Knowledge Base"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h2 className="font-semibold">Available Knowledge ({docs.length})</h2>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...
                </div>
              ) : docs.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No documents yet. Add knowledge above.</p>
              ) : (
                <div className="space-y-3">
                  {docs.map(renderDoc)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );

  function renderDoc(doc: KnowledgeDoc) {
    return (
      <Card key={doc.id}>
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ""}</span>
            </div>
            <p className="mt-1 font-medium text-slate-900">{doc.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{doc.source_ref}</p>
            <p className="mt-1 text-xs text-slate-400">{doc.chunkCount} chunk{doc.chunkCount !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => handleDelete(doc.id)}
            disabled={deleting === doc.id}
            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Delete"
          >
            {deleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </CardContent>
      </Card>
    );
  }
}
