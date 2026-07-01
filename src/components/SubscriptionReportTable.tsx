"use client";

import { useMemo, useState } from "react";
import { TablePager } from "./TablePager";

export interface SubscriptionRow {
  transaction_id: string;
  transaction_date: string | null;
  restaurant_name: string | null;
  package_name: string;
  duration: string;
  pricing: number;
  payment_status: string;
  payment_method: string;
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

export function SubscriptionReportTable({ rows }: { rows: SubscriptionRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.transaction_id.toLowerCase().includes(q) || (r.restaurant_name ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const csv = useMemo(() => {
    const head = "sl,transaction_id,transaction_date,restaurant,package,duration,pricing,payment_status,payment_method";
    const body = filtered.map((r, i) =>
      [i + 1, r.transaction_id, r.transaction_date ?? "", r.restaurant_name ?? "", r.package_name, r.duration, r.pricing, r.payment_status, r.payment_method]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [head, ...body].join("\n");
  }, [filtered]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">
          📋 Subscription Report <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span>
        </h2>
        <div className="flex items-center gap-3">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Search by ID or restaurant…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="subscription-report.csv" className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">SL</th>
              <th className="px-4 py-3 font-semibold">Transaction Id</th>
              <th className="px-4 py-3 font-semibold">Transaction Date</th>
              <th className="px-4 py-3 font-semibold">Restaurant Name</th>
              <th className="px-4 py-3 font-semibold">Package Name</th>
              <th className="px-4 py-3 font-semibold">Duration</th>
              <th className="px-4 py-3 font-semibold text-right">Pricing</th>
              <th className="px-4 py-3 font-semibold">Payment Status</th>
              <th className="px-4 py-3 font-semibold">Payment Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">No subscriptions found.</td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={r.transaction_id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-6 py-3 font-mono text-xs text-slate-400">{(safePage - 1) * pageSize + i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.transaction_id}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.transaction_date)}</td>
                <td className="px-4 py-3 text-slate-800">{r.restaurant_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-800">{r.package_name}</td>
                <td className="px-4 py-3 text-slate-600">{r.duration}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.pricing)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 capitalize">{r.payment_status}</span>
                </td>
                <td className="px-4 py-3 text-emerald-700 text-xs">{r.payment_method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePager page={safePage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} filtered={!!search} />
    </div>
  );
}
