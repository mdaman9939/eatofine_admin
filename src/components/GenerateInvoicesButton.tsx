"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function GenerateInvoicesButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setResult(null);
    const body: { period_start?: string; period_end?: string } = {};
    if (periodStart) body.period_start = periodStart;
    if (periodEnd) body.period_end = periodEnd;
    startTransition(async () => {
      const res = await fetch("/api/admin/vendor-invoices/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(text.slice(0, 160) || `Request failed (${res.status})`);
        return;
      }
      try {
        const parsed = JSON.parse(text) as { generated?: number; created?: number; count?: number };
        const n = parsed.generated ?? parsed.created ?? parsed.count;
        setResult(typeof n === "number" ? `Generated ${n} invoice${n === 1 ? "" : "s"}.` : "Generation complete.");
      } catch {
        setResult("Generation complete.");
      }
      setOpen(false);
      setPeriodStart("");
      setPeriodEnd("");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setError(null); setResult(null); }}
        disabled={pending}
        className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 ring-1 ring-white/25 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        {pending ? "Generating…" : "Generate invoices"}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl bg-white text-slate-800 shadow-2xl ring-1 ring-slate-200 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Generate invoices</div>
          <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
            Leave both fields blank to generate for the previous month. Otherwise pick an explicit
            billing period.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Period start</span>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Period end</span>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </label>
          </div>
          {error && <div className="mt-3 text-xs text-rose-600 bg-rose-50 ring-1 ring-rose-100 rounded-md px-2 py-1.5">{error}</div>}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {pending ? "Generating…" : "Generate"}
            </button>
          </div>
        </div>
      )}

      {result && !open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-emerald-800 text-xs px-3 py-2 shadow-md">
          {result}
        </div>
      )}
    </div>
  );
}
