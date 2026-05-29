"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function FreeDeliveryToggle({ initial }: { initial: { min_order_value: number; status: boolean } }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [minVal, setMinVal] = useState(initial.min_order_value);
  const [status, setStatus] = useState(initial.status);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/admin/user-delivery-charges/free-delivery", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ min_order_value: minVal, status }),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 160)); return; }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-end">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Min order value</span>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
            <input
              type="number"
              step="10"
              value={minVal}
              onChange={(e) => setMinVal(parseFloat(e.target.value) || 0)}
              className="block w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      <div className={`rounded-xl border ${status ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200"} p-4 transition-colors`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={status}
            onChange={(e) => setStatus(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
          />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-slate-900">Free delivery enabled</span>
            <span className="block text-xs text-slate-600 mt-0.5">
              When on, orders at or above the threshold get free delivery (the calculator returns ₹0 and surge multipliers are skipped).
            </span>
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-slate-400"}`} />
            {status ? "Active" : "Off"}
          </span>
        </label>
      </div>

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {saved && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Threshold saved.
        </p>
      )}
    </form>
  );
}
