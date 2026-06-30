"use client";

import { useMemo, useState } from "react";
import { PageButton, PageWindow } from "./PaginatedTable";

export interface EarningRow {
  sr: number;
  order_id: number;
  dm_id: number | null;
  dm_name: string;
  date: string | null;
  delivery_fee: number;
  tips: number;
  situational: number;
  total: number;
}
export interface BonusRow {
  sr: number;
  dm_id: number | null;
  dm_name: string;
  date: string | null;
  note: string;
  amount: number;
}

const PAGE_SIZE = 15;

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}
function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "rose" | "blue" | "slate" | "cyan" }) {
  const map = {
    emerald: "text-emerald-600", amber: "text-amber-600", rose: "text-rose-600",
    blue: "text-blue-600", slate: "text-slate-700", cyan: "text-cyan-700",
  } as const;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
      <div className={`text-2xl font-bold tabular-nums ${map[tone]}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function DeliverymanEarningTransactions({ earnings, bonusIncentive }: { earnings: EarningRow[]; bonusIncentive: BonusRow[] }) {
  const [tab, setTab] = useState<"earnings" | "bonus">("earnings");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // ── Earnings tab ─────────────────────────────────────────────────────────
  const earnRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return earnings;
    return earnings.filter((r) => `${r.dm_name} ${r.order_id}`.toLowerCase().includes(q));
  }, [earnings, search]);
  const earnTotals = useMemo(() => ({
    deliveries: earnRows.length,
    fee: earnRows.reduce((s, r) => s + r.delivery_fee, 0),
    tips: earnRows.reduce((s, r) => s + r.tips, 0),
    situational: earnRows.reduce((s, r) => s + r.situational, 0),
    total: earnRows.reduce((s, r) => s + r.total, 0),
  }), [earnRows]);

  // ── Bonus / Incentive tab ─────────────────────────────────────────────────
  const bonusRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bonusIncentive;
    return bonusIncentive.filter((r) => `${r.dm_name} ${r.note}`.toLowerCase().includes(q));
  }, [bonusIncentive, search]);
  const bonusTotals = useMemo(() => ({
    count: bonusRows.length,
    total: bonusRows.reduce((s, r) => s + r.amount, 0),
  }), [bonusRows]);

  // ── Pagination over the active tab's filtered rows ────────────────────────
  const activeCount = tab === "earnings" ? earnRows.length : bonusRows.length;
  const totalPages = Math.max(1, Math.ceil(activeCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const earnPage = earnRows.slice(startIdx, startIdx + PAGE_SIZE);
  const bonusPage = bonusRows.slice(startIdx, startIdx + PAGE_SIZE);

  const csv = useMemo(() => {
    if (tab === "earnings") {
      const head = "sr,order_id,deliveryman,date,delivery_fee,tips,situational_fee,total_earned";
      const body = earnRows.map((r, i) =>
        [i + 1, r.order_id, r.dm_name, r.date ?? "", r.delivery_fee, r.tips, r.situational, r.total].map(csvCell).join(","));
      return [head, ...body].join("\n");
    }
    const head = "sr,deliveryman,date,note,bonus_incentive";
    const body = bonusRows.map((r, i) => [i + 1, r.dm_name, r.date ?? "", r.note, r.amount].map(csvCell).join(","));
    return [head, ...body].join("\n");
  }, [tab, earnRows, bonusRows]);

  const switchTab = (t: "earnings" | "bonus") => { setTab(t); setSearch(""); setPage(1); };
  const onSearch = (v: string) => { setSearch(v); setPage(1); };

  const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500";
  const th = "px-4 py-3 font-semibold";
  const thR = "px-4 py-3 font-semibold text-right";

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Recent Transactions</h2>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["earnings", "bonus"] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-emerald-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            {t === "earnings" ? "Earnings" : "Bonus / Incentive"}
          </button>
        ))}
      </div>

      {/* Total as per filter */}
      {tab === "earnings" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Number of Deliveries" value={earnTotals.deliveries.toString()} tone="blue" />
          <StatCard label="Deliveries Fees" value={inr(earnTotals.fee)} tone="emerald" />
          <StatCard label="Tips" value={inr(earnTotals.tips)} tone="cyan" />
          <StatCard label="Situational Fee" value={inr(earnTotals.situational)} tone="amber" />
          <StatCard label="Total Earning" value={inr(earnTotals.total)} tone="slate" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-xl">
          <StatCard label="Number of achieved Bonus/Incentive" value={bonusTotals.count.toString()} tone="blue" />
          <StatCard label="Total Bonus/Incentive" value={inr(bonusTotals.total)} tone="amber" />
        </div>
      )}

      {/* List card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">
            {tab === "earnings" ? "Earnings" : "Bonus / Incentive"}
            <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{activeCount}</span>
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder={tab === "earnings" ? "🔍 Search name / order id…" : "🔍 Search name / note…"} className={`${inputCls} min-w-[220px]`} />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`deliveryman-${tab}.csv`} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          {tab === "earnings" ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className={th}>Sr</th>
                  <th className={th}>Order id</th>
                  <th className={th}>Deliveryman Name</th>
                  <th className={th}>Date</th>
                  <th className={thR}>Delivery fees</th>
                  <th className={thR}>Tips</th>
                  <th className={thR}>Situational Fee</th>
                  <th className={thR}>Total Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earnPage.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">No earnings for this filter.</td></tr>
                ) : earnPage.map((r, i) => (
                  <tr key={r.order_id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{startIdx + i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.order_id}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{r.dm_name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.delivery_fee)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.tips)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.situational)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className={th}>Sr</th>
                  <th className={th}>Deliveryman Name</th>
                  <th className={th}>Date</th>
                  <th className={th}>Note</th>
                  <th className={thR}>Bonus / Incentive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bonusPage.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No bonus / incentive for this filter.</td></tr>
                ) : bonusPage.map((r, i) => (
                  <tr key={`${r.dm_id}-${startIdx + i}`} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{startIdx + i + 1}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">{r.dm_name}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.date)}</td>
                    <td className="px-4 py-3 text-slate-600">{r.note}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-amber-700">{inr(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {activeCount > PAGE_SIZE && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700 tabular-nums">{startIdx + 1}</span>
              {" – "}
              <span className="font-semibold text-slate-700 tabular-nums">{Math.min(startIdx + PAGE_SIZE, activeCount)}</span>
              {" of "}
              <span className="font-semibold text-slate-700 tabular-nums">{activeCount}</span>
              {search && <span className="text-slate-400"> (filtered)</span>}
            </div>
            <div className="inline-flex items-center gap-1">
              <PageButton disabled={safePage === 1} onClick={() => setPage(1)} label="« First" />
              <PageButton disabled={safePage === 1} onClick={() => setPage(safePage - 1)} label="‹ Prev" />
              <PageWindow current={safePage} total={totalPages} onJump={setPage} />
              <PageButton disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} label="Next ›" />
              <PageButton disabled={safePage === totalPages} onClick={() => setPage(totalPages)} label="Last »" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
