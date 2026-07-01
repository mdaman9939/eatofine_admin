"use client";

import { useMemo, useState } from "react";
import { TablePager } from "./TablePager";

export interface WalletTxn {
  transaction_id: string;
  customer: string | null;
  credit: number;
  debit: number;
  balance: number;
  transaction_type: string;
  reference: string;
  created_at: string | null;
}

export interface WalletTotals {
  credit: number;
  debit: number;
  balance: number;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}

export function CustomerWalletReport({ rows, totals }: { rows: WalletTxn[]; totals: WalletTotals }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.transaction_id.toLowerCase().includes(q) || (r.customer ?? "").toLowerCase().includes(q) || r.reference.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const csv = useMemo(() => {
    const head = "sl,transaction_id,customer,credit,debit,balance,transaction_type,reference,created_at";
    const body = filtered.map((r, i) =>
      [i + 1, r.transaction_id, r.customer ?? "", r.credit, r.debit, r.balance, r.transaction_type, r.reference, r.created_at ?? ""]
        .map((v) => { const s = v == null ? "" : String(v); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; }).join(","),
    );
    return [head, ...body].join("\n");
  }, [filtered]);

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-slate-900">📋 Customer Wallet Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
          <div className="text-lg font-bold text-emerald-700">Debit</div>
          <div className="mt-1 text-2xl font-bold text-emerald-800">{inr(totals.debit)}</div>
        </div>
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-6">
          <div className="text-lg font-bold text-rose-700">Credit</div>
          <div className="mt-1 text-2xl font-bold text-rose-800">{inr(totals.credit)}</div>
        </div>
        <div className="bg-sky-50 rounded-2xl border border-sky-200 p-6">
          <div className="text-lg font-bold text-sky-700">Balance</div>
          <div className="mt-1 text-2xl font-bold text-sky-800">{inr(totals.balance)}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Transactions <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span></h3>
          <div className="flex items-center gap-3">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search by id / customer / ref…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="wallet-transactions.csv" className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SI</th>
                <th className="px-4 py-3 font-semibold">Transaction Id</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold text-right">Credit</th>
                <th className="px-4 py-3 font-semibold text-right">Debit</th>
                <th className="px-4 py-3 font-semibold text-right">Balance</th>
                <th className="px-4 py-3 font-semibold">Transaction Type</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">No wallet transactions found.</td></tr>
              ) : pageRows.map((r, i) => (
                <tr key={r.transaction_id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{(safePage - 1) * pageSize + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.transaction_id}</td>
                  <td className="px-4 py-3 text-slate-800">{r.customer ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{inr(r.credit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-rose-600">{inr(r.debit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.balance)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 capitalize">{r.transaction_type.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.reference}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePager page={safePage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} filtered={!!search} />
      </div>
    </div>
  );
}
