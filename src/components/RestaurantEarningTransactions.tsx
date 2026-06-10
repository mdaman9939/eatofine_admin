"use client";

import { useMemo, useState } from "react";

interface EarnTxn { txn_id: string; date: string | null; source: string | null; source_type: string; earning_source: string; amount: number }
interface ExpTxn { txn_id: string; date: string | null; source: string | null; source_type: string; expense_type: string; earning_source: string; amount: number }
interface SubTxn { txn_id: string; date: string | null; restaurant: string | null; transaction_type: string; amount: number }

export interface RestaurantEarningTxns {
  transactions: { earnings: EarnTxn[]; expenses: ExpTxn[]; subscription: SubTxn[] };
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

type Tab = "earnings" | "expenses" | "subscription";

export function RestaurantEarningTransactions({ data }: { data: RestaurantEarningTxns }) {
  const [tab, setTab] = useState<Tab>("earnings");
  const [search, setSearch] = useState("");

  const { earnings, expenses, subscription } = data.transactions;

  const q = search.trim().toLowerCase();
  const fEarnings = useMemo(() => !q ? earnings : earnings.filter((t) => t.txn_id.toLowerCase().includes(q) || t.earning_source.toLowerCase().includes(q) || (t.source ?? "").toLowerCase().includes(q)), [earnings, q]);
  const fExpenses = useMemo(() => !q ? expenses : expenses.filter((t) => t.txn_id.toLowerCase().includes(q) || t.earning_source.toLowerCase().includes(q) || (t.source ?? "").toLowerCase().includes(q)), [expenses, q]);
  const fSubs = useMemo(() => !q ? subscription : subscription.filter((t) => t.txn_id.toLowerCase().includes(q) || (t.restaurant ?? "").toLowerCase().includes(q)), [subscription, q]);

  const csv = useMemo(() => {
    if (tab === "earnings") {
      const head = "sl,transaction_id,date,source,earning_source,amount";
      return [head, ...fEarnings.map((t, i) => [i + 1, t.txn_id, t.date ?? "", t.source ?? "", t.earning_source, t.amount].map(csvCell).join(","))].join("\n");
    }
    if (tab === "expenses") {
      const head = "sl,transaction_id,date,source,expense_source,amount";
      return [head, ...fExpenses.map((t, i) => [i + 1, t.txn_id, t.date ?? "", t.source ?? "", `${t.expense_type} ${t.earning_source}`, t.amount].map(csvCell).join(","))].join("\n");
    }
    const head = "sl,transaction_id,date,restaurant,transaction_type,amount";
    return [head, ...fSubs.map((t, i) => [i + 1, t.txn_id, t.date ?? "", t.restaurant ?? "", t.transaction_type, t.amount].map(csvCell).join(","))].join("\n");
  }, [tab, fEarnings, fExpenses, fSubs]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tab === "subscription" ? "🔍 Search by Txn ID or Restaurant…" : "🔍 Search by Order ID…"} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`restaurant-${tab}.csv`} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
        </div>
      </div>

      <div className="px-6 pt-4 flex gap-2">
        {([["earnings", "Earnings"], ["expenses", "Expenses"], ["subscription", "Subscription"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => { setTab(k); setSearch(""); }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tab === k ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>
        ))}
      </div>

      <div className="overflow-x-auto mt-2">
        {tab === "earnings" && (
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
              {fEarnings.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No earnings.</td></tr>
              ) : fEarnings.map((t, i) => (
                <tr key={`${t.txn_id}-${i}`} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{t.txn_id}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{t.source ?? "—"}</div>
                    <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{t.source_type}</span>
                  </td>
                  <td className="px-4 py-3 text-blue-600 text-xs font-medium">{t.earning_source}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">{inr(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "expenses" && (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SL</th>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Expense Source</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fExpenses.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No expenses.</td></tr>
              ) : fExpenses.map((t, i) => (
                <tr key={`${t.txn_id}-${i}`} className="hover:bg-rose-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{t.txn_id}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800">{t.source ?? "—"}</div>
                    <span className="inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{t.source_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">{t.expense_type}</span>
                    <div className="text-blue-600 text-xs font-medium mt-0.5">{t.earning_source}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-700">{inr(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "subscription" && (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SL</th>
                <th className="px-4 py-3 font-semibold">Transaction ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold">Transaction Type</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fSubs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No subscription transactions.</td></tr>
              ) : fSubs.map((t, i) => (
                <tr key={`${t.txn_id}-${i}`} className="hover:bg-blue-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.txn_id}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(t.date)}</td>
                  <td className="px-4 py-3 text-slate-800">{t.restaurant ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">{t.transaction_type}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}
