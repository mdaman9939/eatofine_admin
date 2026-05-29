"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export interface PlatformSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  value_type: "int" | "float" | "string" | "bool" | "json";
  category: "auth" | "dm" | "promo" | "billing" | "general";
  label: string;
  description: string | null;
  min_value: number | null;
  max_value: number | null;
  updated_at: string | null;
}

function guessUnit(label: string): string | null {
  const l = label.toLowerCase();
  if (/(minute|min\b|timeout|expir|ttl|duration|interval)/.test(l)) return "min";
  if (/(second|\bsec\b)/.test(l)) return "sec";
  if (/(hour|hr\b)/.test(l)) return "hr";
  if (/(day|days)/.test(l)) return "days";
  if (/(percent|percentage|\%|rate)/.test(l)) return "%";
  if (/(attempt|count|max\s|number of)/.test(l)) return null;
  if (/(amount|fee|cap|limit\s*\(?\$|price)/.test(l)) return "₹";
  return null;
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "never";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function SettingRow({ setting }: { setting: PlatformSetting }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<string>(setting.setting_value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const dirty = value !== (setting.setting_value ?? "");
  const unit = setting.value_type === "int" || setting.value_type === "float" ? guessUnit(setting.label) : null;

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/platform-settings/${encodeURIComponent(setting.setting_key)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j.error || j.message || text;
        } catch {
          /* keep raw text */
        }
        setError(String(msg).slice(0, 200));
        return;
      }
      setSavedAt(new Date().toISOString());
      router.refresh();
    });
  }

  function toggleBool() {
    const next = value === "1" || value === "true" ? "0" : "1";
    setValue(next);
  }

  const boolOn = value === "1" || value === "true";

  return (
    <div className="px-5 py-4 flex flex-col md:flex-row md:items-start gap-4 hover:bg-slate-50/60 transition-colors">
      <div className="md:w-1/3 min-w-0">
        <div className="text-sm font-semibold text-slate-900">{setting.label}</div>
        {setting.description && (
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{setting.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 ring-1 ring-slate-200">
            {setting.setting_key}
          </code>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            {setting.value_type}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {setting.value_type === "bool" ? (
            <button
              type="button"
              onClick={toggleBool}
              disabled={pending}
              className={`relative cursor-pointer inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                boolOn ? "bg-gradient-to-r from-emerald-500 to-emerald-600" : "bg-slate-300"
              }`}
              aria-pressed={boolOn}
              aria-label={`Toggle ${setting.label}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-1 ring-black/5 transition-transform ${
                  boolOn ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          ) : setting.value_type === "int" || setting.value_type === "float" ? (
            <div className="relative flex-1 min-w-[140px] max-w-[260px]">
              <input
                type="number"
                step={setting.value_type === "float" ? "0.01" : "1"}
                min={setting.min_value ?? undefined}
                max={setting.max_value ?? undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={pending}
                className="w-full pl-3 pr-12 py-2 text-sm tabular-nums rounded-lg border border-slate-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition disabled:bg-slate-50"
              />
              {unit && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                  {unit}
                </span>
              )}
            </div>
          ) : setting.value_type === "json" ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={pending}
              rows={3}
              className="flex-1 min-w-[200px] px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition disabled:bg-slate-50"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={pending}
              className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition disabled:bg-slate-50"
            />
          )}

          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 disabled:shadow-none transition-all"
          >
            {pending ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" className="opacity-25" />
                  <path strokeWidth="3" strokeLinecap="round" d="M4 12a8 8 0 018-8" className="opacity-75" />
                </svg>
                Saving
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px]">
          {(setting.value_type === "int" || setting.value_type === "float") &&
            (setting.min_value !== null || setting.max_value !== null) && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <span className="font-medium text-slate-600">Range:</span>
                <span className="tabular-nums">
                  {setting.min_value ?? "−∞"} – {setting.max_value ?? "∞"}
                </span>
              </span>
            )}

          {dirty && !error && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200 font-semibold">
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              Unsaved
            </span>
          )}

          {error && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 ring-1 ring-rose-200 font-semibold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </span>
          )}

          <span className="ml-auto text-slate-400">
            Updated {formatTimestamp(savedAt ?? setting.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
