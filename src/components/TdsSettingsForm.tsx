"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface TdsSettings {
  id: number;
  default_rate: number;
  threshold: number;
  section_code: string;
  financial_year_start: string;
  status: boolean;
  updated_by: string | null;
  updated_at: string | null;
}

const SAMPLE_PAYOUT = 45000; // Used to preview impact under the entered rate/threshold.

export function TdsSettingsForm({ initial }: { initial: TdsSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [rate, setRate] = useState(initial.default_rate);
  const [threshold, setThreshold] = useState(initial.threshold);
  const [section, setSection] = useState(initial.section_code);
  const [fyStart, setFyStart] = useState(initial.financial_year_start?.slice(0, 10) ?? "");
  const [status, setStatus] = useState(initial.status);

  // Live impact preview (computed client-side; matches backend logic).
  const previewApplies = status && SAMPLE_PAYOUT >= threshold;
  const previewTds = previewApplies ? +(SAMPLE_PAYOUT * rate / 100).toFixed(2) : 0;
  const previewDisburse = +(SAMPLE_PAYOUT - previewTds).toFixed(2);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const res = await fetch("/api/admin/tds/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          default_rate: rate,
          threshold,
          section_code: section,
          financial_year_start: fyStart,
          status,
          updated_by: "admin",
        }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 160));
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Settings form */}
      <form onSubmit={save} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Default TDS rate %" hint="Section 194C default = 2%">
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className={inputClass}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
            </div>
          </Field>

          <Field label="Threshold ₹" hint="Per-vendor cumulative payout floor">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
              <input
                type="number"
                step="100"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                className={inputClass + " pl-7"}
              />
            </div>
          </Field>

          <Field label="Section code" hint="Income Tax Act reference">
            <input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className={inputClass}
              placeholder="194C"
            />
          </Field>

          <Field label="Financial year start" hint="Resets cumulative thresholds">
            <input
              type="date"
              value={fyStart}
              onChange={(e) => setFyStart(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Status toggle */}
        <div className={`rounded-xl border ${status ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200"} p-4 transition-colors`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            />
            <span className="flex-1">
              <span className="block text-sm font-semibold text-slate-900">TDS deductions enabled</span>
              <span className="block text-xs text-slate-600 mt-0.5">
                When off, no TDS is withheld during disbursements even if the threshold is crossed. Use this for testing or compliance pauses.
              </span>
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${status ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-slate-400"}`} />
              {status ? "Active" : "Paused"}
            </span>
          </label>
        </div>

        {initial.updated_at && (
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last updated by <strong className="text-slate-700">{initial.updated_by ?? "—"}</strong> on{" "}
            {new Date(initial.updated_at).toLocaleString("en-IN")}
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </p>
        )}
        {saved && (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Settings saved.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all"
          >
            {pending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      {/* Live impact preview */}
      <aside className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/80 to-white p-5 self-start">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">Live impact preview</div>
            <div className="text-[11px] text-slate-500">For a vendor net payout of ₹{SAMPLE_PAYOUT.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <Row label="Net payout" value={`₹${SAMPLE_PAYOUT.toLocaleString("en-IN")}`} />
          <Row label="Threshold" value={`₹${threshold.toLocaleString("en-IN")}`} muted />
          <div className="border-t border-slate-200 pt-2.5">
            {previewApplies ? (
              <Row label={`TDS @ ${rate}%`} value={`−₹${previewTds.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} color="text-rose-700" bold />
            ) : !status ? (
              <Row label="TDS" value="paused" color="text-slate-500" />
            ) : (
              <Row label="TDS" value="below threshold" color="text-slate-500" />
            )}
          </div>
          <div className="border-t-2 border-slate-200 pt-2.5">
            <Row label="Vendor receives" value={`₹${previewDisburse.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} color="text-emerald-700" bold large />
          </div>
        </div>

        <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
          {previewApplies
            ? `Your settings would deduct TDS on this vendor's payout because ₹${SAMPLE_PAYOUT.toLocaleString("en-IN")} ≥ threshold.`
            : !status
              ? "TDS deductions are currently paused — no withholding will happen on any disbursement."
              : `No TDS deducted — net payout is below the ₹${threshold.toLocaleString("en-IN")} threshold.`}
        </p>
      </aside>
    </div>
  );
}

function Row({ label, value, bold, muted, large, color }: { label: string; value: string; bold?: boolean; muted?: boolean; large?: boolean; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={`${muted ? "text-slate-500 text-xs" : "text-slate-700 text-sm"}`}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-bold" : "font-medium"} ${large ? "text-xl" : ""} ${color ?? "text-slate-900"}`}>{value}</span>
    </div>
  );
}

const inputClass =
  "block w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-slate-600 font-semibold">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}
