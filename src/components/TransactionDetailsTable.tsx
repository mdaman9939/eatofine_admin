"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export interface TxnRow {
  order_id: number;
  restaurant: string | null;
  customer_name: string | null;
  total_item_amount: number;
  item_discount: number;
  coupon_discount: number;
  referral_discount: number;
  discounted_amount: number;
  vat_tax: number;
  delivery_charge: number;
  order_amount: number;
  admin_discount: number;
  restaurant_discount: number;
  admin_commission: number;
  service_charge: number;
  extra_packaging_amount: number;
  commission_on_delivery_charge: number;
  admin_net_income: number;
  restaurant_net_income: number;
  amount_received_by: string;
  payment_method: string;
  payment_status: string;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Column order matches StackFood's "Transaction details" table.
const COLS: Array<{ key: keyof TxnRow; label: string; money?: boolean }> = [
  { key: "total_item_amount", label: "Total Item Amount", money: true },
  { key: "item_discount", label: "Item Discount", money: true },
  { key: "coupon_discount", label: "Coupon Discount", money: true },
  { key: "referral_discount", label: "Referral Discount", money: true },
  { key: "discounted_amount", label: "Discounted Amount", money: true },
  { key: "vat_tax", label: "GST", money: true },
  { key: "delivery_charge", label: "Delivery Charge", money: true },
  { key: "order_amount", label: "Order Amount", money: true },
  { key: "admin_discount", label: "Admin Discount", money: true },
  { key: "restaurant_discount", label: "Restaurant Discount", money: true },
  { key: "admin_commission", label: "Admin Commission", money: true },
  { key: "service_charge", label: "Service Charge", money: true },
  { key: "extra_packaging_amount", label: "Extra Packaging Amount", money: true },
  { key: "commission_on_delivery_charge", label: "Commission On Delivery Charge", money: true },
  { key: "admin_net_income", label: "Admin Net Income", money: true },
  { key: "restaurant_net_income", label: "Restaurant Net Income", money: true },
];

export function TransactionDetailsTable({ rows }: { rows: TxnRow[] }) {
  const [search, setSearch] = useState("");

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

  const csv = useMemo(() => {
    const headers = ["sl", "order_id", "restaurant", "customer", ...COLS.map((c) => c.key), "amount_received_by", "payment_method", "payment_status"];
    const body = filtered.map((r, i) =>
      [i + 1, r.order_id, r.restaurant ?? "", r.customer_name ?? "", ...COLS.map((c) => r[c.key]), r.amount_received_by, r.payment_method, r.payment_status]
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
          <h2 className="text-base font-semibold text-slate-900">Transaction details — order-wise</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {rows.length} transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Order id / restaurant / customer…"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[240px]"
          />
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="transactions.csv"
            className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap"
          >
            ⬇ Export
          </a>
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
              {COLS.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold text-right">{c.label}</th>
              ))}
              <th className="px-4 py-3 font-semibold">Amount Received By</th>
              <th className="px-4 py-3 font-semibold">Payment Method</th>
              <th className="px-4 py-3 font-semibold">Payment Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={COLS.length + 8} className="px-6 py-12 text-center text-slate-400 text-sm">No transactions in this window.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.order_id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-400 sticky left-0 bg-white z-10">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.order_id}</td>
                <td className="px-4 py-3 text-slate-800">{r.restaurant ?? "—"}</td>
                <td className="px-4 py-3 text-slate-800">{r.customer_name ?? "—"}</td>
                {COLS.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {c.money ? inr(r[c.key] as number) : String(r[c.key])}
                  </td>
                ))}
                <td className="px-4 py-3 text-slate-600 text-xs">{r.amount_received_by}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">{r.payment_method.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${r.payment_status === "paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                    {r.payment_status}
                  </span>
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
  );
}
