"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface ExpenseRow {
  order_id: number;
  date_time: string | null;
  expense_type: string;
  customer_name: string | null;
  amount: number;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function ExpenseDetailsTable({ rows }: { rows: ExpenseRow[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  const types = useMemo(() => Array.from(new Set(rows.map((r) => r.expense_type))), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!type || r.expense_type === type) &&
        (!q || String(r.order_id).includes(q) || (r.customer_name ?? "").toLowerCase().includes(q) || r.expense_type.toLowerCase().includes(q)),
    );
  }, [rows, search, type]);

  const csv = useMemo(() => {
    const headers = "sl,order_id,date_time,expense_type,customer,amount";
    const body = filtered.map((r, i) =>
      [i + 1, r.order_id, r.date_time ?? "", r.expense_type, r.customer_name ?? "", r.amount]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [headers, ...body].join("\n");
  }, [filtered]);

  const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Expense Lists <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Per-order discounts the platform funded.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            <option value="">All Type</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search by Order ID or customer…"
            className={`${inputCls} min-w-[240px]`}
          />
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="expenses.csv"
            className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap"
          >
            ⬇ Export
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">SI</th>
              <th className="px-4 py-3 font-semibold">Order Id</th>
              <th className="px-4 py-3 font-semibold">Date &amp; Time</th>
              <th className="px-4 py-3 font-semibold">Expense Type</th>
              <th className="px-4 py-3 font-semibold">Customer Name</th>
              <th className="px-4 py-3 font-semibold text-right">Expense Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No expenses in this window.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={`${r.order_id}-${r.expense_type}`} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/orders/${r.order_id}`} className="font-mono text-xs text-blue-600 hover:underline">#{r.order_id}</Link>
                </td>
                <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.date_time)}</td>
                <td className="px-4 py-3 text-slate-800">{r.expense_type}</td>
                <td className="px-4 py-3 text-slate-800">{r.customer_name ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-rose-600">{inr(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
