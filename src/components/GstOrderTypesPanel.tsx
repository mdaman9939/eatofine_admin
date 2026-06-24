"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { key: "take_away", label: "Take Away" },
  { key: "dine_in", label: "Dine In" },
  { key: "delivery", label: "Home Delivery" },
];

/**
 * Centralized control for which order types FOOD GST + the restaurant
 * extra-packaging charge apply to. Persists `food_gst_order_types` as a CSV in
 * business_settings; the backend (config / placeOrder / get-Tax / POS) reads it
 * so the Customer App, Restaurant Panel and POS all stay in sync.
 */
export function GstOrderTypesPanel({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sel, setSel] = useState<Set<string>>(new Set(initial));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (k: string) => {
    setSaved(false);
    setSel((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const save = () => {
    setError(null);
    setSaved(false);
    // Write an explicit "none" sentinel for an empty selection so readers can
    // tell "GST applies to no order type" apart from "never configured" (which
    // falls back to the legacy toggle). sanitizeOrderTypes("none") → [].
    const csv = sel.size === 0 ? "none" : TYPES.map((t) => t.key).filter((k) => sel.has(k)).join(",");
    startTransition(async () => {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: [{ key: "food_gst_order_types", value: csv }] }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-900">GST &amp; extra-packaging — order types</h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Food GST and the restaurant extra-packaging charge are taken on the order types ticked here.
            Per-charge platform / convenience / packaging fees are scoped on each charge below. Changes
            apply to the Customer App, Restaurant Panel and POS automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 shadow-sm"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {TYPES.map((t) => (
          <label
            key={t.key}
            className={`inline-flex items-center gap-2 text-sm cursor-pointer rounded-lg border px-3 py-2 transition-colors ${sel.has(t.key) ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            <input
              type="checkbox"
              checked={sel.has(t.key)}
              onChange={() => toggle(t.key)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            />
            {t.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      {saved && !error && <p className="mt-2 text-xs text-emerald-700">Saved.</p>}
    </div>
  );
}
