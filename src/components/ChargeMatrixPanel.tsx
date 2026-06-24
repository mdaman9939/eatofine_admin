"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/** One configured additional charge, as returned by /admin/additional-charges. */
export interface MatrixCharge {
  id: number;
  charge_head: string;
  charge_type: "fixed" | "percentage";
  amount: number;
  gst_applicable: boolean;
  gst_rate: number;
  status: boolean;
  order_types: string[];
}

const SERVICES = [
  { key: "take_away", label: "Take Away" },
  { key: "dine_in", label: "Dine In" },
  { key: "delivery", label: "Home Delivery" },
];

/**
 * Single, unified place to configure EVERY user charge per service
 * (Take Away / Dine In / Home Delivery). Each row is a charge; each service
 * column is a checkbox controlling whether that charge applies there. Amounts
 * are edited inline (one amount per charge, applied uniformly wherever it's
 * enabled). The top row scopes Food GST + extra packaging. All changes reflect
 * automatically in the Customer App, Restaurant Panel and POS.
 */
export function ChargeMatrixPanel({
  charges: initialCharges,
  foodGstRate,
  gstInitial,
}: {
  charges: MatrixCharge[];
  foodGstRate: number;
  gstInitial: string[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [charges, setCharges] = useState<MatrixCharge[]>(initialCharges);
  const [gstTypes, setGstTypes] = useState<string[]>(gstInitial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchCharge(id: number, body: Record<string, unknown>) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/additional-charges/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 200)); return false; }
      startTransition(() => router.refresh());
      return true;
    } finally { setBusy(false); }
  }

  async function saveGstTypes(next: string[]) {
    setError(null);
    setBusy(true);
    // "none" sentinel for an empty selection so the backend can tell "GST applies
    // nowhere" apart from "never configured" (which falls back to legacy).
    const csv = next.length === 0 ? "none" : next.join(",");
    try {
      const res = await fetch("/api/admin/business-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: [{ key: "food_gst_order_types", value: csv }] }),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 200)); return; }
      startTransition(() => router.refresh());
    } finally { setBusy(false); }
  }

  function toggleService(charge: MatrixCharge, service: string) {
    const has = charge.order_types.includes(service);
    const next = has ? charge.order_types.filter((t) => t !== service) : [...charge.order_types, service];
    setCharges((cs) => cs.map((c) => (c.id === charge.id ? { ...c, order_types: next } : c)));
    void patchCharge(charge.id, { order_types: next });
  }

  function toggleGstService(service: string) {
    const has = gstTypes.includes(service);
    const next = has ? gstTypes.filter((t) => t !== service) : [...gstTypes, service];
    setGstTypes(next);
    void saveGstTypes(next);
  }

  function toggleActive(charge: MatrixCharge) {
    const next = !charge.status;
    setCharges((cs) => cs.map((c) => (c.id === charge.id ? { ...c, status: next } : c)));
    void patchCharge(charge.id, { status: next });
  }

  function commitAmount(charge: MatrixCharge, raw: string) {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n < 0 || n === charge.amount) return;
    setCharges((cs) => cs.map((c) => (c.id === charge.id ? { ...c, amount: n } : c)));
    void patchCharge(charge.id, { amount: n });
  }

  async function deleteCharge(charge: MatrixCharge) {
    if (!confirm(`Delete “${charge.charge_head}”? This removes it from every service.`)) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/additional-charges/${charge.id}`, { method: "DELETE" });
      if (!res.ok) { setError((await res.text()).slice(0, 200)); return; }
      setCharges((cs) => cs.filter((c) => c.id !== charge.id));
      startTransition(() => router.refresh());
    } finally { setBusy(false); }
  }

  const cell = "px-3 py-2.5 text-center";
  const checkbox = (on: boolean, onChange: () => void, disabled = false) => (
    <input
      type="checkbox"
      checked={on}
      disabled={disabled || busy}
      onChange={onChange}
      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer disabled:opacity-50"
    />
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Charges by service</h2>
        <p className="text-xs text-slate-500 mt-0.5 max-w-3xl">
          One place to manage every charge per service. Tick a service to apply a charge there; edit the
          amount inline (the same amount applies wherever the charge is enabled). The top row scopes Food
          GST &amp; extra packaging. Changes reflect automatically in the Customer App, Restaurant Panel and POS.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Charge</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              {SERVICES.map((s) => <th key={s.key} className="px-3 py-3 font-semibold text-center">{s.label}</th>)}
              <th className="px-3 py-3 font-semibold text-center">Active</th>
              <th className="px-3 py-3 font-semibold text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Food GST + extra packaging — scope row (writes food_gst_order_types). */}
            <tr className="bg-emerald-50/30">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-800">Food GST &amp; extra packaging</div>
                <div className="text-[11px] text-slate-500">Platform-collected GST (sec 9(5)) + restaurant extra packaging</div>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-700 tabular-nums">{foodGstRate}%</td>
              {SERVICES.map((s) => (
                <td key={s.key} className={cell}>{checkbox(gstTypes.includes(s.key), () => toggleGstService(s.key))}</td>
              ))}
              <td className="px-3 py-3 text-center text-slate-300">—</td>
              <td className="px-3 py-3 text-right">
                <Link href="/dashboard/invoice-setup" className="text-xs font-semibold text-emerald-700 hover:underline">Rate</Link>
              </td>
            </tr>

            {/* One row per configured additional charge. */}
            {charges.map((c) => (
              <tr key={c.id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{c.charge_head}</div>
                  <div className="text-[11px] text-slate-500">
                    {c.charge_type === "percentage" ? "Percentage of subtotal" : "Fixed amount"}
                    {c.gst_applicable ? ` · ${c.gst_rate}% GST` : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    {c.charge_type === "fixed" && <span className="text-slate-400">₹</span>}
                    <input
                      type="number" min={0} step="any"
                      defaultValue={c.amount}
                      disabled={busy}
                      onBlur={(e) => commitAmount(c, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-right text-sm focus:outline-none focus:border-emerald-500"
                    />
                    {c.charge_type === "percentage" && <span className="text-slate-400">%</span>}
                  </span>
                </td>
                {SERVICES.map((s) => (
                  <td key={s.key} className={cell}>{checkbox(c.order_types.includes(s.key), () => toggleService(c, s.key))}</td>
                ))}
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    disabled={busy}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.status ? "bg-emerald-600" : "bg-slate-300"} disabled:opacity-50`}
                    aria-label="Toggle active"
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${c.status ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <Link href={`/dashboard/additional-charges/${c.id}/edit`} className="text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:underline">Edit</Link>
                  <button type="button" onClick={() => deleteCharge(c)} disabled={busy} className="ml-3 text-xs font-semibold text-rose-500 hover:text-rose-700 disabled:opacity-50">Delete</button>
                </td>
              </tr>
            ))}
            {charges.length === 0 && (
              <tr>
                <td colSpan={SERVICES.length + 4} className="px-6 py-8 text-center text-sm text-slate-400">
                  No charges configured yet. Use “New additional charge” above to add one (e.g. Platform Fee).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {error && <p className="px-6 py-2 text-xs text-rose-600 bg-rose-50 border-t border-rose-100">{error}</p>}
    </div>
  );
}
