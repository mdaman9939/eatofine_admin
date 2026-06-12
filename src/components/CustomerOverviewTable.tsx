"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface CustomerRow {
  customer_id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  image_full_url: string | null;
  joining_date: string | null;
  total_order: number;
  total_spent: number;
  aov: number;
  last_purchase: string | null;
  most_used_payment_method: string | null;
}

export interface CustomerStats {
  total_customers: number;
  new_customers: number;
  active: number;
  inactive: number;
  returning: number;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function CustomerOverviewTable({ rows, stats }: { rows: CustomerRow[]; stats: CustomerStats }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q) || (r.phone ?? "").includes(q));
  }, [rows, search]);

  const csv = useMemo(() => {
    const head = "sl,customer,email,phone,joining_date,total_order,total_spent,aov,last_purchase,payment_method";
    const body = filtered.map((r, i) =>
      [i + 1, r.name ?? "", r.email ?? "", r.phone ?? "", r.joining_date ?? "", r.total_order, r.total_spent, r.aov, r.last_purchase ?? "", r.most_used_payment_method ?? ""]
        .map((v) => { const s = v == null ? "" : String(v); return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s; }).join(","),
    );
    return [head, ...body].join("\n");
  }, [filtered]);

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-slate-900">Customer Overview Report</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Customers" value={stats.total_customers} tone="text-blue-600" />
        <StatCard label="New Customers" value={stats.new_customers} tone="text-emerald-600" />
        <StatCard label="Active Customers" value={stats.active} tone="text-indigo-600" />
        <StatCard label="Returning Customers" value={stats.returning} tone="text-amber-600" />
        <StatCard label="Inactive Customers" value={stats.inactive} tone="text-rose-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">Customer list <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span></h3>
          <div className="flex items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search by name / email…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="customers.csv" className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SI</th>
                <th className="px-4 py-3 font-semibold">Customer Info</th>
                <th className="px-4 py-3 font-semibold">Joining Date</th>
                <th className="px-4 py-3 font-semibold text-right">Total Order</th>
                <th className="px-4 py-3 font-semibold text-right">Total Spent</th>
                <th className="px-4 py-3 font-semibold text-right">AOV</th>
                <th className="px-4 py-3 font-semibold">Last Purchase</th>
                <th className="px-4 py-3 font-semibold">Most Used Payment</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-slate-400 text-sm">No customers found.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.customer_id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.image_full_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_full_url} alt={r.name ?? ""} className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-100" />
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{r.name ?? "—"}</div>
                        <div className="text-xs text-slate-500">{r.email ?? r.phone ?? ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.joining_date)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{r.total_order}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.total_spent)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.aov)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.last_purchase ? fmtDate(r.last_purchase) : "Never Ordered"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs capitalize">{r.most_used_payment_method ? r.most_used_payment_method.replace(/_/g, " ") : "N/A"}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/dashboard/users/${r.customer_id}`}
                      title="View all previous activity"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
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
