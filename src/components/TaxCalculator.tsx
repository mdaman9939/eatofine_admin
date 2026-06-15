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
    vendor_id: number | null;
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

export function TaxCalculator() {
  const [amount, setAmount] = useState<string>("350");
  const [sameState, setSameState] = useState(true);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function calculate() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/tax-engine/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_value: parseFloat(amount) || 0,
          same_state: sameState,
        }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        setResult(null);
        return;
      }
      setResult(await res.json() as CalcResult);
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Live calculator</h2>
            <p className="text-xs text-slate-500 mt-0.5">Combines BRD §5.1 slab + §5.3 GST engine. Result computed server-side.</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 tracking-wide">new</span>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">Order value ₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
            />
          </label>

          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">GST mode</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSameState(true)}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  sameState
                    ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-500/25"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Intra-state
                <div className="text-[10px] font-normal opacity-80">CGST + SGST</div>
              </button>
              <button
                type="button"
                onClick={() => setSameState(false)}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  !sameState
                    ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-500/25"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Inter-state
                <div className="text-[10px] font-normal opacity-80">IGST</div>
              </button>
            </div>
          </div>

          <button
            onClick={calculate}
            disabled={pending || !amount}
            className="w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 shadow-sm hover:shadow transition-all"
          >
            {pending ? "Calculating…" : "Calculate"}
          </button>
          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>}

          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold mb-2">Try these values:</div>
            <div className="flex flex-wrap gap-1.5">
              {[50, 150, 275, 450, 750].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 transition-colors"
                >
                  ₹{v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Output */}
        <div>
          {!result ? (
            <EmptyPreview />
          ) : (
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
                  <div className="mt-0.5 text-2xl font-bold text-emerald-700 tracking-tight tabular-nums">
                    ₹{result.vendor_payout.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <Row label="Order value" value={`₹${result.order_value.toFixed(2)}`} />
                    <Row label="Fixed charge" value={`₹${result.breakdown.fixed_charge.toFixed(2)}`} />
                    {result.breakdown.extra_charge > 0 && (
                      <Row label="Extra charge" value={`₹${result.breakdown.extra_charge.toFixed(2)}`} />
                    )}
                    <Row label="Base charge" value={`₹${result.breakdown.base_charge.toFixed(2)}`} bold />
                    <Row
                      label={`GST @ ${result.breakdown.gst_rate}% on ₹${result.breakdown.gst_base.toFixed(2)} (${result.matched_slab.gst_on_extra ? "Fixed+Extra" : "Fixed only"})`}
                      value={`₹${result.breakdown.gst_amount.toFixed(2)}`}
                      sub
                    />
                    {result.breakdown.cgst > 0 && <Row label="CGST" value={`₹${result.breakdown.cgst.toFixed(2)}`} indent />}
                    {result.breakdown.sgst > 0 && <Row label="SGST" value={`₹${result.breakdown.sgst.toFixed(2)}`} indent />}
                    {result.breakdown.igst > 0 && <Row label="IGST" value={`₹${result.breakdown.igst.toFixed(2)}`} indent />}
                    <Row label="Total deduction" value={`₹${result.breakdown.total_deduction.toFixed(2)}`} color="text-rose-700" bold />
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 italic">{result.tax_mode}</p>
            </div>
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
            <div className="mt-2 h-4 w-40 rounded bg-slate-200" />
          </div>
          <div className="text-right">
            <div className="h-3 w-28 rounded bg-emerald-200 ml-auto" />
            <div className="mt-2 h-7 w-32 rounded bg-emerald-300 ml-auto" />
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-white ring-1 ring-slate-200 overflow-hidden">
          {[60, 55, 65, 50, 70, 45, 80].map((w, i) => (
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
          <p className="text-sm font-medium text-slate-700">Pick a tax mode + order value</p>
          <p className="text-xs text-slate-500 mt-0.5">Hit Calculate to see the slab + GST breakdown.</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, sub, indent, color }: { label: string; value: string; bold?: boolean; sub?: boolean; indent?: boolean; color?: string }) {
  return (
    <tr>
      <td className={`px-4 py-2 ${sub ? "text-slate-500 text-xs" : indent ? "pl-8 text-slate-600 text-xs" : "text-slate-700"}`}>{label}</td>
      <td className={`px-4 py-2 text-right tabular-nums ${bold ? "font-bold" : sub || indent ? "text-xs" : "font-medium"} ${color ?? "text-slate-900"}`}>{value}</td>
    </tr>
  );
}
