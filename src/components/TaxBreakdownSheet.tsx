"use client";

import { useState } from "react";

/** Structured tax/charge breakdown. Every number is computed UPSTREAM from the
 *  existing order / invoice / fee math and passed in — this component never
 *  recomputes tax, it only presents. Restaurant GST and Platform GST are kept
 *  separate, and CGST/SGST vs IGST is chosen by `interState` (place of supply). */
export interface TaxBreakdownData {
  currency?: string;
  restaurantGst?: {
    ratePct: number;        // e.g. 5
    interState: boolean;    // false ⇒ CGST+SGST, true ⇒ IGST
    cgst: number;
    sgst: number;
    igst: number;
  } | null;
  platformServiceGst?: {
    ratePct?: number | null; // shown in the header when the service charges share one rate
    items: Array<{ label: string; amount: number }>;
  } | null;
  packagingCharges?: number;
}

const money = (n: number, cur = "₹") => `${cur}${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
const pct = (n: number) => `${Number((Math.round(n * 100) / 100).toFixed(2))}%`;

/**
 * Zomato-style "GST and Restaurant Charges Included" disclosure: a clickable row
 * with an info icon that opens a bottom-sheet listing the detailed
 * Taxes & Charges Breakdown. Reusable across POS checkout / order details.
 */
export function TaxBreakdownDisclosure({
  data,
  label = "GST and Restaurant Charges Included",
  className = "",
}: {
  data: TaxBreakdownData;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const cur = data.currency ?? "₹";

  const rg = data.restaurantGst ?? null;
  const rgTotal = rg ? (rg.interState ? rg.igst : rg.cgst + rg.sgst) : 0;
  const psItems = data.platformServiceGst?.items ?? [];
  const psTotal = psItems.reduce((s, i) => s + (i.amount || 0), 0);
  const totalTaxes = Math.round((rgTotal + psTotal) * 100) / 100;
  const packaging = data.packagingCharges ?? 0;

  // Nothing to disclose → render nothing (keeps the bill clean for ₹0-tax orders).
  if (!rg && psItems.length === 0 && packaging <= 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors ${className}`}
      >
        <span className="flex items-center gap-1.5">
          <InfoIcon className="w-4 h-4 shrink-0" />
          {label}
        </span>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl ring-1 ring-slate-200 max-h-[85vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden flex justify-center pt-2.5">
              <span className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-slate-500 hover:text-slate-700 -ml-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-base font-bold text-slate-900">Taxes &amp; Charges Breakdown</h3>
              <span className="w-5" />
            </div>

            <div className="px-5 py-4 space-y-4 text-sm">
              {rg && (
                <Section title={`Restaurant GST (${pct(rg.ratePct)})`}>
                  {rg.interState ? (
                    <Line label={`IGST (${pct(rg.ratePct)})`} value={money(rg.igst, cur)} />
                  ) : (
                    <>
                      <Line label={`CGST (${pct(rg.ratePct / 2)})`} value={money(rg.cgst, cur)} />
                      <Line label={`SGST (${pct(rg.ratePct / 2)})`} value={money(rg.sgst, cur)} />
                    </>
                  )}
                </Section>
              )}

              {psItems.length > 0 && (
                <Section
                  title={`Platform Service GST${
                    data.platformServiceGst?.ratePct ? ` (${pct(data.platformServiceGst.ratePct)})` : ""
                  }`}
                >
                  {psItems.map((i, idx) => (
                    <Line key={idx} label={i.label} value={money(i.amount, cur)} />
                  ))}
                </Section>
              )}

              {packaging > 0 && (
                <Section title="Packaging Charges">
                  <Line label="Packaging Charges" value={money(packaging, cur)} muted />
                </Section>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-sm font-bold text-emerald-700 uppercase tracking-wide">Total Taxes Included</span>
                <span className="text-base font-bold text-emerald-700 tabular-nums">{money(totalTaxes, cur)}</span>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                <InfoIcon className="w-4 h-4 shrink-0 mt-0.5" />
                Tax amount may vary if items are added or removed from the order.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-slate-500" : "text-slate-700"}>{label}</span>
      <span className={`tabular-nums ${muted ? "text-slate-500" : "text-slate-800 font-medium"}`}>{value}</span>
    </div>
  );
}

function InfoIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
