"use client";

import { useState, useTransition } from "react";

interface CalcResult {
  distance_km: number;
  order_value: number;
  matched_slab: { id: number; min_km: number; max_km: number; base_charge: number; extra_per_km: number; gst_rate: number } | null;
  base_charge: number;
  extra_charge: number;
  base_after_surge?: number;
  surge_multiplier: number;
  surcharges: Array<{ id: number; type: string; label: string; amount: number; gst_amount: number }>;
  subtotal: number;
  gst_amount: number;
  total: number;
  free_delivery: boolean;
  notes?: string;
}

export function UserDeliveryCalculator() {
  const [distance, setDistance] = useState(7);
  const [orderValue, setOrderValue] = useState(400);
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16));
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/user-delivery-charges/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ distance_km: distance, order_value: orderValue, when }),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 200)); return; }
      const data = (await res.json()) as Partial<CalcResult>;
      // Coerce every numeric field so a null/absent value from the API never
      // crashes the render (e.g. null.toLocaleString / null.toFixed).
      const n = (v: unknown, d = 0) => (v == null || Number.isNaN(Number(v)) ? d : Number(v));
      setResult({
        distance_km: n(data.distance_km),
        order_value: n(data.order_value),
        matched_slab: data.matched_slab
          ? {
              id: n(data.matched_slab.id),
              min_km: n(data.matched_slab.min_km),
              max_km: n(data.matched_slab.max_km),
              base_charge: n(data.matched_slab.base_charge),
              extra_per_km: n(data.matched_slab.extra_per_km),
              gst_rate: n(data.matched_slab.gst_rate),
            }
          : null,
        base_charge: n(data.base_charge),
        extra_charge: n(data.extra_charge),
        base_after_surge: n(data.base_after_surge),
        surge_multiplier: n(data.surge_multiplier, 1),
        surcharges: Array.isArray(data.surcharges)
          ? data.surcharges.map((s) => ({ id: n(s.id), type: String(s.type ?? ""), label: String(s.label ?? ""), amount: n(s.amount), gst_amount: n(s.gst_amount) }))
          : [],
        subtotal: n(data.subtotal),
        gst_amount: n(data.gst_amount),
        total: n(data.total),
        free_delivery: !!data.free_delivery,
        notes: data.notes,
      });
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">Live calculator</h2>
          <p className="text-xs text-slate-500 mt-0.5">Slab × surge × surcharges → user-side fee. GST applied per BRD §6.5.</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Distance (km)</span>
            <input
              type="number"
              step="0.1"
              min="0"
              value={distance}
              onChange={(e) => setDistance(parseFloat(e.target.value) || 0)}
              className={inp}
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Order value</span>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
              <input
                type="number"
                step="1"
                value={orderValue}
                onChange={(e) => setOrderValue(parseFloat(e.target.value) || 0)}
                className={inp.replace("mt-1", "") + " pl-7"}
                style={{ marginTop: 0 }}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">When</span>
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className={inp}
            />
          </label>
          <button
            onClick={run}
            disabled={pending}
            className="cursor-pointer w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 shadow-sm hover:shadow transition-all"
          >
            {pending ? "Calculating…" : "Calculate"}
          </button>
          {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1.5">{error}</p>}
        </div>

        {/* Output */}
        <div>
          {!result ? (
            <EmptyPreview />
          ) : result.free_delivery ? (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white ring-1 ring-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">Result</div>
                  <div className="text-2xl font-bold text-emerald-700">Free delivery applied</div>
                </div>
              </div>
              <p className="text-sm text-emerald-900/80">{result.notes}</p>
            </div>
          ) : result.matched_slab ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Matched slab</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    {result.matched_slab.min_km}–{result.matched_slab.max_km} km · GST {result.matched_slab.gst_rate}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">Total user-payable</div>
                  <div className="mt-0.5 text-2xl font-bold text-emerald-700 tracking-tight tabular-nums">
                    ₹{result.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <Row label="Base charge" value={`₹${result.base_charge.toFixed(2)}`} />
                    {result.extra_charge > 0 && (
                      <Row label="Long Distance Charge" value={`₹${result.extra_charge.toFixed(2)}`} />
                    )}
                    {result.surge_multiplier !== 1 && (
                      <Row
                        label={
                          <span className="inline-flex items-center gap-1.5">
                            Surge
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 ring-1 ring-amber-200 px-1.5 py-0.5 rounded">
                              ×{result.surge_multiplier}
                            </span>
                          </span>
                        }
                        value={`₹${(result.base_after_surge ?? 0).toFixed(2)}`}
                      />
                    )}
                    {result.surcharges.map((s) => (
                      <Row
                        key={s.id}
                        label={`+ ${s.label}`}
                        value={`₹${s.amount.toFixed(2)}${s.gst_amount > 0 ? ` (+ ₹${s.gst_amount.toFixed(2)} GST)` : ""}`}
                        sub
                      />
                    ))}
                    <Row label="Subtotal" value={`₹${result.subtotal.toFixed(2)}`} />
                    <Row label="GST total" value={`₹${result.gst_amount.toFixed(2)}`} sub />
                    <Row label="Total user-payable" value={`₹${result.total.toFixed(2)}`} bold />
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                Base × surge multiplier → + matching surcharges → + GST. Per BRD §6.5, GST applies to the user side.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{result.notes ?? "No slab matched."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="relative h-full min-h-[260px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden">
      <div className="absolute inset-0 p-5 select-none pointer-events-none opacity-40">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-2 h-4 w-44 rounded bg-slate-200" />
          </div>
          <div className="text-right">
            <div className="h-3 w-28 rounded bg-emerald-200 ml-auto" />
            <div className="mt-2 h-7 w-32 rounded bg-emerald-300 ml-auto" />
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-white ring-1 ring-slate-200 overflow-hidden">
          {[60, 55, 70, 50, 65, 80, 75].map((w, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 border-b last:border-b-0 border-slate-100">
              <div className="h-3 rounded bg-slate-200" style={{ width: `${w}%` }} />
              <div className="h-3 w-14 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-500">
          <div className="w-11 h-11 rounded-xl bg-white ring-1 ring-slate-200 shadow-sm flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Enter distance, value, and time</p>
          <p className="text-xs text-slate-500 mt-0.5">Hit Calculate for the full breakdown.</p>
        </div>
      </div>
    </div>
  );
}

const inp =
  "block w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all";

function Row({ label, value, sub, bold }: { label: React.ReactNode; value: string; sub?: boolean; bold?: boolean }) {
  return (
    <tr>
      <td className={`px-4 py-2 ${sub ? "pl-6 text-slate-500 text-xs" : bold ? "text-slate-800 font-semibold" : "text-slate-700"}`}>{label}</td>
      <td className={`px-4 py-2 text-right tabular-nums ${bold ? "font-bold text-slate-900" : sub ? "text-xs text-slate-500" : "font-medium text-slate-900"}`}>{value}</td>
    </tr>
  );
}
