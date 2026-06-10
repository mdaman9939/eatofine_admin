"use client";

import { useMemo, useState } from "react";

export interface FoodReportRow {
  food_id: number;
  name: string | null;
  image_full_url: string | null;
  restaurant: string | null;
  order_count: number;
  price: number;
  total_amount_sold: number;
  total_discount: number;
  average_sale_value: number;
  avg_rating: number;
  rating_count: number;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function YearlyChart({ yearly }: { yearly: Array<{ year: number; total: number }> }) {
  if (!yearly.length) return null;
  const max = Math.max(...yearly.map((y) => y.total), 1);
  const avg = yearly.reduce((s, y) => s + y.total, 0) / yearly.length;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-900">📊 Sales Statistics</h2>
        <span className="text-xs text-slate-500">Average yearly sales: <span className="font-semibold text-slate-700">{inr(avg)}</span></span>
      </div>
      <div className="flex items-end gap-6 h-48 px-2">
        {yearly.map((y) => (
          <div key={y.year} className="flex-1 flex flex-col items-center justify-end gap-2 group">
            <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{inr(y.total)}</span>
            <div
              className="w-full max-w-[40px] rounded-t bg-gradient-to-t from-sky-400 to-sky-300 hover:from-sky-500 transition-colors"
              style={{ height: `${Math.max(4, (y.total / max) * 160)}px` }}
            />
            <span className="text-xs text-slate-500 font-medium">{y.year}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span className="inline-block w-3 h-3 rounded-sm bg-sky-300" /> Total Amount Sold
      </div>
    </div>
  );
}

export function FoodReportTable({ rows, yearly }: { rows: FoodReportRow[]; yearly: Array<{ year: number; total: number }> }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.name ?? "").toLowerCase().includes(q) || (r.restaurant ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  const csv = useMemo(() => {
    const head = "sl,name,restaurant,order_count,price,total_amount_sold,total_discount,average_sale_value,avg_rating,rating_count";
    const body = filtered.map((r, i) =>
      [i + 1, r.name ?? "", r.restaurant ?? "", r.order_count, r.price, r.total_amount_sold, r.total_discount, r.average_sale_value, r.avg_rating, r.rating_count]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [head, ...body].join("\n");
  }, [filtered]);

  return (
    <div className="space-y-6">
      <YearlyChart yearly={yearly} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Food Report Table <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span>
          </h2>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search by food name…"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]"
            />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="food-report.csv" className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SI</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold text-right">Order Count</th>
                <th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold text-right">Total Amount Sold</th>
                <th className="px-4 py-3 font-semibold text-right">Total Discount Given</th>
                <th className="px-4 py-3 font-semibold text-right">Average Sale Value</th>
                <th className="px-4 py-3 font-semibold">Average Ratings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">No food sales found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.food_id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.image_full_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_full_url} alt={r.name ?? ""} className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100" />
                      )}
                      <span className="font-medium text-slate-900">{r.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.restaurant ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{r.order_count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.total_amount_sold)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-rose-600">{inr(r.total_discount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.average_sale_value)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      ★ {r.avg_rating ? r.avg_rating.toFixed(1) : "0.0"}
                      <span className="text-xs text-slate-400">({r.rating_count})</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
