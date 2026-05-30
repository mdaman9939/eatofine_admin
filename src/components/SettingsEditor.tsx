"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Setting {
  id: number;
  key: string;
  value: string | null;
}

export function SettingsEditor({ initial }: { initial: Setting[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, string>>({});

  function onChange(key: string, value: string) {
    setDirty((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    if (Object.keys(dirty).length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          settings: Object.entries(dirty).map(([key, value]) => ({ key, value })),
        }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setDirty({});
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {Object.keys(dirty).length} unsaved change{Object.keys(dirty).length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={pending || Object.keys(dirty).length === 0}
          className="rounded bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm px-3 py-1.5"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-700">
        {initial.map((s) => {
          // MongoDB may return values as numbers, objects, or null. Coerce to
          // string so the input/textarea + length/includes calls don't crash.
          const safeValue = s.value === null || s.value === undefined
            ? ""
            : typeof s.value === "string" ? s.value : String(s.value);
          const isLong = safeValue.length > 80 || safeValue.includes("\n");
          const current = dirty[s.key] !== undefined ? dirty[s.key] : safeValue;
          return (
            <div key={s.key} className="px-4 py-3 flex flex-col md:flex-row md:items-start gap-3">
              <div className="md:w-1/3 break-all">
                <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{s.key}</span>
              </div>
              <div className="flex-1">
                {isLong ? (
                  <textarea
                    value={current}
                    onChange={(e) => onChange(s.key, e.target.value)}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1 text-sm font-mono min-h-[60px]"
                  />
                ) : (
                  <input
                    type="text"
                    value={current}
                    onChange={(e) => onChange(s.key, e.target.value)}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1 text-sm font-mono"
                  />
                )}
                {dirty[s.key] !== undefined && (
                  <span className="text-xs text-amber-600">modified</span>
                )}
              </div>
            </div>
          );
        })}
        {initial.length === 0 && (
          <p className="px-4 py-8 text-center text-zinc-500 text-sm">No settings match this filter.</p>
        )}
      </div>
    </div>
  );
}
