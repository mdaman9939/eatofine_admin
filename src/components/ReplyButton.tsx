"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ReplyButton({
  path,
  initial = "",
  field = "reply",
  label = "Reply",
}: {
  path: string;
  initial?: string;
  field?: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin${path}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [field]: text }),
      });
      if (!res.ok) {
        const t = await res.text();
        setError(t.slice(0, 100));
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-zinc-700 hover:bg-zinc-800 text-white text-xs px-2.5 py-1"
      >
        {initial ? "Edit reply" : label}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 items-start">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1 text-xs w-48 min-h-[40px]"
      />
      <div className="flex flex-col gap-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 disabled:opacity-50"
        >
          {pending ? "…" : "Send"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-zinc-500">
          Cancel
        </button>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  );
}
