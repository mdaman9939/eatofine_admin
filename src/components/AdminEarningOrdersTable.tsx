"use client";

import { useMemo, useState } from "react";

export interface AdminEarningOrderRow {
  order_id: number;
  customer_name: string | null;
  restaurant: string | null;
  order_type: string;
  earning_restaurant: number;
  earning_delivery: number;
  earning_additional: number;
  earning_situational: number;
  total_earning: number;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const ORDER_TYPE: Record<string, { label: string; tone: string }> = {
  delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  home_delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  take_away: { label: "Take Away", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  dine_in: { label: "Dine In", tone: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
};

const MONEY: Array<{ key: keyof AdminEarningOrderRow; label: string }> = [
  { key: "earning_restaurant", label: "Earning from Restaurant (PPO / Commission)" },
  { key: "earning_delivery", label: "Earning from Delivery Fee" },
  { key: "earning_additional", label: "Earning from Additional Charge" },
  { key: "earning_situational", label: "Earning from Situational Charge" },
  { key: "total_earning", label: "Total Earning" },
];

export function AdminEarningOrdersTable({ rows }: { rows: AdminEarningOrderRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.order_id).includes(q) ||
        (r.restaurant ?? "").toLowerCase().includes(q) ||
        (r.customer_name ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const grandTotal = useMemo(() => filtered.reduce((s, r) => s + (Number(r.total_earning) || 0), 0), [filtered]);

  const csv = useMemo(() => {
    const headers = ["Sr", "Order ID", "Customer Name", "Restaurant Name", "Order Type", ...MONEY.map((c) => c.label)];
    const body = filtered.map((r, i) =>
      [i + 1, r.order_id, r.customer_name ?? "", r.restaurant ?? "", ORDER_TYPE[r.order_type]?.label ?? r.order_type, ...MONEY.map((c) => r[c.key])]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [headers.join(","), ...body].join("\n");
  }, [filtered]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Earning — Order-wise</h2>
          <p className="text-xs text-slate-500 mt-0.5">What the platform earns per order · total <span className="font-semibold text-emerald-700">{inr(grandTotal)}</span></p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Order ID / restaurant / customer…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="admin-earning-orders.csv" className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-10">Sr.</th>
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Customer Name</th>
              <th className="px-4 py-3 font-semibold">Restaurant Name</th>
              <th className="px-4 py-3 font-semibold">Order Type</th>
              {MONEY.map((c) => <th key={c.key} className={`px-4 py-3 font-semibold text-right ${c.key === "total_earning" ? "text-emerald-700" : ""}`}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={MONEY.length + 5} className="px-6 py-12 text-center text-slate-400 text-sm">No earnings in this window.</td></tr>
            ) : pageRows.map((r, i) => {
              const ot = ORDER_TYPE[r.order_type] ?? { label: r.order_type, tone: "bg-slate-100 text-slate-600 ring-slate-200" };
              return (
                <tr key={r.order_id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 sticky left-0 bg-white z-10">{(safePage - 1) * pageSize + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.order_id}</td>
                  <td className="px-4 py-3 text-slate-800">{r.customer_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-800">{r.restaurant ?? "—"}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${ot.tone}`}>{ot.label}</span></td>
                  {MONEY.map((c) => <td key={c.key} className={`px-4 py-3 text-right tabular-nums ${c.key === "total_earning" ? "font-semibold text-emerald-700" : "text-slate-700"}`}>{inr(r[c.key] as number)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">Page {safePage} of {totalPages} · {filtered.length} orders</span>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">Prev</button>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
