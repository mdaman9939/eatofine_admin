"use client";

import { useState, useTransition } from "react";

interface CalcResult {
  order_value: number;
  matched_slab: {
    id: number;
    min_order_value: number;
    max_order_value: number;
    fixed_charge: number;
    extra_charge: number;
    gst_rate: number;
    gst_on_extra: boolean;
  };
  breakdown: {
    fixed_charge: number;
    extra_charge: number;
    base_charge: number;
    gst_base: number;
    gst_rate: number;
    gst_amount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total_deduction: number;
  };
  vendor_payout: number;
  tax_mode: string;
}

export function SlabCalculator() {
  const [orderValue, setOrderValue] = useState(500);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function calculate(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/tax-engine/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order_value: orderValue }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 180));
        setResult(null);
        return;
      }
      setResult(await res.json() as CalcResult);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-6 4h4m2 5l4-4M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2h-2" />
          </svg>
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-slate-900">Try a sample order</h2>
          <p className="text-xs text-slate-500 mt-0.5">See which slab matches and the full deduction breakdown.</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input */}
        <form onSubmit={calculate} className="lg:col-span-1 space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Order value ₹</span>
            <input
              type="number"
              step="1"
              min="0"
              value={orderValue}
              onChange={(e) => setOrderValue(parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[150, 350, 700, 1500].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setOrderValue(v)}
                className="cursor-pointer text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 transition-colors"
              >
                ₹{v}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 shadow-sm hover:shadow transition-all"
          >
            {pending ? "Calculating…" : "Calculate"}
          </button>
          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>}
        </form>

        {/* Result */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Matched slab</div>
                  <div className="mt-0.5 text-sm font-semibold text-slate-900">
                    #{result.matched_slab.id} · ₹{result.matched_slab.min_order_value} – ₹{result.matched_slab.max_order_value}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">Vendor net payout</div>
                  <div className="mt-0.5 text-2xl font-bold text-emerald-700 tracking-tight">
                    ₹{result.vendor_payout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <Row label="Fixed charge" value={`₹${result.breakdown.fixed_charge.toFixed(2)}`} />
                    {result.breakdown.extra_charge > 0 && (
                      <Row label="Extra charge" value={`₹${result.breakdown.extra_charge.toFixed(2)}`} />
                    )}
                    <Row label="Base charge" value={`₹${result.breakdown.base_charge.toFixed(2)}`} />
                    <Row
                      label={`GST @ ${result.breakdown.gst_rate}% on ₹${result.breakdown.gst_base.toFixed(2)}`}
                      value={`₹${result.breakdown.gst_amount.toFixed(2)}`}
                      sub
                    />
                    <Row label="Total deduction" value={`₹${result.breakdown.total_deduction.toFixed(2)}`} bold />
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                Order value ₹{result.order_value.toLocaleString("en-IN")} − total deduction = vendor net payout of
                ₹{result.vendor_payout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}.
              </p>
            </div>
          ) : (
            <div className="relative h-full min-h-[200px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden">
              <div className="absolute inset-0 p-5 select-none pointer-events-none opacity-40">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="h-3 w-24 rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-40 rounded bg-slate-200" />
                  </div>
                  <div className="text-right">
                    <div className="h-3 w-28 rounded bg-emerald-200 ml-auto" />
                    <div className="mt-2 h-7 w-32 rounded bg-emerald-300 ml-auto" />
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-white ring-1 ring-slate-200 overflow-hidden">
                  {[60, 55, 65, 45, 75].map((w, i) => (
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
                  <p className="text-sm font-medium text-slate-700">Try an order value</p>
                  <p className="text-xs text-slate-500 mt-0.5">Hit Calculate to see the full deduction breakdown.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, sub }: { label: string; value: string; bold?: boolean; sub?: boolean }) {
  return (
    <tr>
      <td className={`px-4 py-2 ${sub ? "text-slate-500 text-xs pl-6" : "text-slate-700"}`}>{label}</td>
      <td className={`px-4 py-2 text-right ${bold ? "font-bold text-slate-900" : sub ? "text-slate-500 text-xs" : "text-slate-800"}`}>{value}</td>
    </tr>
  );
}
