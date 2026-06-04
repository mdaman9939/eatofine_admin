"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function fmtDate(iso: string | null): string {
  if (!iso) return "never";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return "never"; }
}

/** Tiny Markdown → HTML renderer for the preview pane. Handles
 *  headings, lists, bold, italics, links, paragraphs. Not a full
 *  parser — just enough to give a useful preview while editing. */
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^### (.*?)$/gm, '<h3 class="text-base font-semibold text-slate-900 mt-3 mb-2">$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-lg font-bold text-slate-900 mt-4 mb-2">$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1 class="text-xl font-bold text-slate-900 mt-4 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-5 list-disc">$1</li>');
  html = html
    .split(/\n\n+/)
    .map((para) => {
      if (/^<(h[123]|li)/.test(para.trim())) return para;
      const lines = para.split("\n").join("<br />");
      return `<p class="text-sm text-slate-700 leading-relaxed my-2">${lines}</p>`;
    })
    .join("\n");
  return html;
}

export function PageEditor({
  slug,
  initialTitle,
  initialContent,
  updatedAt,
}: {
  slug: string;
  initialTitle: string;
  initialContent: string;
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState(updatedAt);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 200));
        return;
      }
      setSavedAt(new Date().toISOString());
      router.refresh();
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <ModeButton current={mode} value="edit" onClick={setMode}>Edit</ModeButton>
          <ModeButton current={mode} value="split" onClick={setMode}>Split</ModeButton>
          <ModeButton current={mode} value="preview" onClick={setMode}>Preview</ModeButton>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Last saved: {fmtDate(savedAt)}</span>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="px-6 py-4 border-b border-slate-100">
        <label className="block">
          <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Page Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Terms & Conditions"
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
          />
        </label>
      </div>

      {/* Editor + Preview */}
      <div className={`grid ${mode === "split" ? "grid-cols-2" : "grid-cols-1"} divide-x divide-slate-100`}>
        {(mode === "edit" || mode === "split") && (
          <div className="p-6">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Markdown</div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="block w-full min-h-[480px] rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all leading-relaxed"
              placeholder="# Heading&#10;&#10;Write your content here…"
              spellCheck={false}
            />
            <p className="mt-2 text-[11px] text-slate-400">Supports # headings, **bold**, *italic*, [links](url), - bullet lists.</p>
          </div>
        )}
        {(mode === "preview" || mode === "split") && (
          <div className="p-6">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Preview</div>
            <div
              className="min-h-[480px] rounded-lg border border-slate-200 bg-white px-5 py-4 overflow-y-auto prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 border-t border-rose-100 bg-rose-50 text-rose-700 text-xs">{error}</div>
      )}
    </div>
  );
}

function ModeButton({
  current, value, onClick, children,
}: { current: string; value: "edit" | "preview" | "split"; onClick: (v: "edit" | "preview" | "split") => void; children: React.ReactNode }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
        active ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
