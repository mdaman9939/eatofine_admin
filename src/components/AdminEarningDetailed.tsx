"use client";

import { useMemo, useState } from "react";

interface BreakdownItem { label: string; amount: number; pct: number }
interface Txn { txn_id: string; date: string | null; source: string | null; source_type: string; earning_source: string; amount: number }

export interface AdminEarningData {
  summary: { total_earnings: number; total_expenses: number; net_profit: number };
  earnings_breakdown: BreakdownItem[];
  expenses_breakdown: BreakdownItem[];
  transactions: { earnings: Txn[]; subscription: Txn[]; expenses: Txn[] };
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

function BreakdownGrid({ title, items }: { title: string; items: BreakdownItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
        {items.map((it) => (
          <div key={it.label} className="border-l-2 border-slate-100 pl-3">
            <div className="text-xs text-slate-500">{it.label}</div>
            <div className="text-lg font-bold text-slate-900">{inr(it.amount)}</div>
            <div className="text-[11px] text-slate-400">{it.pct.toFixed(2)}% of total</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminEarningDetailed({ data }: { data: AdminEarningData }) {
  const [tab, setTab] = useState<"earnings" | "subscription" | "expenses">("earnings");
  const [search, setSearch] = useState("");

  const list = tab === "earnings" ? data.transactions.earnings : tab === "subscription" ? data.transactions.subscription : data.transactions.expenses;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => t.txn_id.toLowerCase().includes(q) || t.earning_source.toLowerCase().includes(q) || (t.source ?? "").toLowerCase().includes(q));
  }, [list, search]);

  const csv = useMemo(() => {
    const head = "sl,transaction_id,date,source,earning_source,amount";
    const body = filtered.map((t, i) =>
      [i + 1, t.txn_id, t.date ?? "", t.source ?? "", t.earning_source, t.amount]
        .map((v) => { const s = v == null ? "" : String(v); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; }).join(","),
    );
    return [head, ...body].join("\n");
  }, [filtered]);

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-slate-900">Earnings Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow">
          <div className="text-sm font-semibold opacity-90">Total Earnings</div>
          <div className="mt-1 text-3xl font-bold">{inr(data.summary.total_earnings)}</div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow">
          <div className="text-sm font-semibold opacity-90">Total Expenses</div>
          <div className="mt-1 text-3xl font-bold">{inr(data.summary.total_expenses)}</div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow">
          <div className="text-sm font-semibold opacity-90">Net Profit</div>
          <div className="mt-1 text-3xl font-bold">{inr(data.summary.net_profit)}</div>
        </div>
      </div>

      <BreakdownGrid title="Earnings Breakdown" items={data.earnings_breakdown} />
      <BreakdownGrid title="Expenses Breakdown" items={data.expenses_breakdown} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Recent Transactions</h3>
          <div className="flex items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search by Txn ID or Order…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`admin-${tab}.csv`} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>
        <div className="px-6 pt-4 flex gap-2">
          {([["earnings", "Earnings"], ["subscription", "Subscription Earnings"], ["expenses", "Expenses"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => { setTab(k); setSearch(""); }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
          ))}
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SL</th>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Earning Source</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No transactions.</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={`${t.txn_id}-${i}`} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{t.txn_id}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{t.source ?? "—"}</div>
                    <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{t.source_type}</span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 text-xs font-medium">{t.earning_source}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
