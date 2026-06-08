"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Inline "rename" control for simple name-only records (attributes, add-on
 * categories, …). Shows the current name; clicking Edit swaps in a text input
 * that PATCHes `basePath/:id` with `{ [field]: value }` on Save.
 */
export function InlineEditName({
  basePath,
  id,
  value,
  field = "name",
}: {
  basePath: string;
  id: number;
  value: string;
  field?: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!draft.trim()) { setError("Name required"); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin${basePath}/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [field]: draft.trim() }),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 100)); return; }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true); }}
        className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
      >
        Edit
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
      >
        {pending ? "…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="cursor-pointer rounded-md px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
      >
        Cancel
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
