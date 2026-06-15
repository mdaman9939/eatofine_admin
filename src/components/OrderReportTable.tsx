"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface OrderReportRow {
  order_id: number;
  restaurant: string | null;
  customer_name: string | null;
  total_item_amount: number;
  item_discount: number;
  coupon_discount: number;
  referral_discount: number;
  discounted_amount: number;
  tax: number;
  delivery_charge: number;
  service_charge: number;
  order_amount: number;
  amount_received_by: string;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string | null;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const MONEY: Array<{ key: keyof OrderReportRow; label: string }> = [
  { key: "total_item_amount", label: "Total Item Amount" },
  { key: "item_discount", label: "Item Discount" },
  { key: "coupon_discount", label: "Coupon Discount" },
  { key: "referral_discount", label: "Referral Discount" },
  { key: "discounted_amount", label: "Discounted Amount" },
  { key: "tax", label: "GST" },
  { key: "delivery_charge", label: "Delivery Charge" },
  { key: "service_charge", label: "Service Charge" },
  { key: "order_amount", label: "Order Amount" },
];

// Group raw statuses into the StackFood stat cards.
const STAT_CARDS: Array<{ label: string; match: string[]; tone: string }> = [
  { label: "Pending", match: ["pending"], tone: "text-sky-600" },
  { label: "Confirmed", match: ["confirmed"], tone: "text-blue-600" },
  { label: "Accepted", match: ["accepted"], tone: "text-indigo-600" },
  { label: "Processing", match: ["processing", "cooking"], tone: "text-amber-600" },
  { label: "On The Way", match: ["handover", "picked_up"], tone: "text-orange-600" },
  { label: "Delivered", match: ["delivered"], tone: "text-emerald-600" },
  { label: "Canceled", match: ["canceled", "cancelled"], tone: "text-rose-600" },
  { label: "Refunded", match: ["refunded"], tone: "text-fuchsia-600" },
  { label: "Failed", match: ["failed"], tone: "text-red-600" },
];

function statusBadge(s: string) {
  const map: Record<string, string> = {
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-sky-50 text-sky-700 border-sky-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    accepted: "bg-indigo-50 text-indigo-700 border-indigo-200",
    processing: "bg-amber-50 text-amber-700 border-amber-200",
    handover: "bg-orange-50 text-orange-700 border-orange-200",
    picked_up: "bg-orange-50 text-orange-700 border-orange-200",
    canceled: "bg-rose-50 text-rose-700 border-rose-200",
    refunded: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    failed: "bg-red-50 text-red-700 border-red-200",
  };
  return map[s] ?? "bg-slate-50 text-slate-700 border-slate-200";
}

export function OrderReportTable({ rows, statusCounts }: { rows: OrderReportRow[]; statusCounts: Record<string, number> }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const statuses = useMemo(() => Array.from(new Set(rows.map((r) => r.order_status))), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!status || r.order_status === status) &&
        (!q || String(r.order_id).includes(q) || (r.restaurant ?? "").toLowerCase().includes(q) || (r.customer_name ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search, status]);

  const csv = useMemo(() => {
    const headers = ["sl", "order_id", "restaurant", "customer", ...MONEY.map((c) => c.key), "amount_received_by", "payment_method", "order_status"];
    const body = filtered.map((r, i) =>
      [i + 1, r.order_id, r.restaurant ?? "", r.customer_name ?? "", ...MONEY.map((c) => r[c.key]), r.amount_received_by, r.payment_method, r.order_status]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [headers.join(","), ...body].join("\n");
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Status stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map((c) => {
          const count = c.match.reduce((s, st) => s + (statusCounts[st] ?? 0), 0);
          return (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
              <div className={`text-xl font-bold ${c.tone}`}>{count}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Total Orders <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span>
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">All status</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Order ID / restaurant / customer…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="order-report.csv" className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-10">SI</th>
                <th className="px-4 py-3 font-semibold">Order Id</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold">Customer Name</th>
                {MONEY.map((c) => <th key={c.key} className="px-4 py-3 font-semibold text-right">{c.label}</th>)}
                <th className="px-4 py-3 font-semibold">Amount Received By</th>
                <th className="px-4 py-3 font-semibold">Payment Method</th>
                <th className="px-4 py-3 font-semibold">Order Status</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={MONEY.length + 8} className="px-6 py-12 text-center text-slate-400 text-sm">No orders in this window.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.order_id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400 sticky left-0 bg-white z-10">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.order_id}</td>
                  <td className="px-4 py-3 text-slate-800">{r.restaurant ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-800">{r.customer_name ?? "—"}</td>
                  {MONEY.map((c) => <td key={c.key} className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r[c.key] as number)}</td>)}
                  <td className="px-4 py-3 text-slate-600 text-xs">{r.amount_received_by}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs capitalize">{r.payment_method.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border capitalize ${statusBadge(r.order_status)}`}>{r.order_status.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/orders/${r.order_id}`} className="text-xs font-semibold text-blue-600 hover:underline">View</Link>
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
