"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/** One row of the detailed Transaction Report (client spec: 29 columns). */
export interface TxnReportRow {
  order_id: number;
  order_type: string;
  restaurant: string | null;
  customer_name: string | null;
  total_item_cost: number;
  restaurant_discount_coupon: number;
  admin_discount: number;
  total_discount: number;
  net_item_value: number;
  gst_on_item: number;
  additional_charge: number;
  gst_on_additional: number;
  delivery_fee: number;
  gst_on_delivery: number;
  deliverymen_tip: number;
  situational_charges: number;
  gst_on_situational: number;
  net_payable_by_user: number;
  payment_mode: string;
  restaurant_income: number;
  tds: number;
  restaurant_net_income: number;
  admin_income_from_restaurant: number;
  admin_income_from_user: number;
  order_delivered: string;
  order_canceled: string;
  order_refunded: string;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const niceType = (t: string) =>
  t === "delivery" || t === "home_delivery" ? "Home Delivery" : t === "take_away" ? "Take Away" : t === "dine_in" ? "Dine In" : t;

// Money columns in the exact order the client listed them (after the 5 header cols).
const MONEY: Array<{ key: keyof TxnReportRow; label: string; tint?: "green" | "amber" }> = [
  { key: "total_item_cost", label: "Total Item Cost" },
  { key: "restaurant_discount_coupon", label: "Restaurant Discount (Coupon)" },
  { key: "admin_discount", label: "Admin Discount" },
  { key: "total_discount", label: "Total Discount" },
  { key: "net_item_value", label: "Net Item Value (After Discount)" },
  { key: "gst_on_item", label: "GST On Item Value" },
  { key: "additional_charge", label: "Additional Charge (Platform/Package/Convenience)" },
  { key: "gst_on_additional", label: "GST on Additional Charge" },
  { key: "delivery_fee", label: "Delivery Fee" },
  { key: "gst_on_delivery", label: "GST on Delivery Fee" },
  { key: "deliverymen_tip", label: "Deliverymen Tip" },
  { key: "situational_charges", label: "Situational Charges (Surge/Festival/Weekend/Late-night)" },
  { key: "gst_on_situational", label: "GST on Situational Charges" },
  { key: "net_payable_by_user", label: "Net Payable Amount By User" },
];
const MONEY_AFTER_PAYMODE: Array<{ key: keyof TxnReportRow; label: string; tint?: "green" | "amber" }> = [
  { key: "restaurant_income", label: "Restaurant Income", tint: "green" },
  { key: "tds", label: "TDS" },
  { key: "restaurant_net_income", label: "Restaurant Net Income (After TDS)", tint: "green" },
  { key: "admin_income_from_restaurant", label: "Admin Income From Restaurant (PPO/Commission)", tint: "amber" },
  { key: "admin_income_from_user", label: "Admin Income from User", tint: "amber" },
];
const FLAGS: Array<{ key: keyof TxnReportRow; label: string }> = [
  { key: "order_delivered", label: "Order Delivered" },
  { key: "order_canceled", label: "Order Canceled" },
  { key: "order_refunded", label: "Order Refunded" },
];

const tintHead = (t?: "green" | "amber") =>
  t === "green" ? "bg-emerald-100 text-emerald-800" : t === "amber" ? "bg-amber-100 text-amber-800" : "bg-slate-50 text-slate-500";
const tintCell = (t?: "green" | "amber") =>
  t === "green" ? "text-emerald-700" : t === "amber" ? "text-amber-700" : "text-slate-700";

function YesNo({ v }: { v: string }) {
  const yes = v === "Yes";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${yes ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{v}</span>
  );
}

const PAGE_SIZE = 25;

export function TransactionReportTable({ rows }: { rows: TxnReportRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  // Client-side pagination over the fetched window (API returns up to 1000 rows).
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const csv = useMemo(() => {
    const cols: Array<keyof TxnReportRow> = [
      "order_id", "order_type", "restaurant", "customer_name",
      ...MONEY.map((c) => c.key), "payment_mode", ...MONEY_AFTER_PAYMODE.map((c) => c.key), ...FLAGS.map((c) => c.key),
    ];
    const headers = ["Sr.", "Order ID", "Order Type", "Restaurant Name", "Customer Name",
      ...MONEY.map((c) => c.label), "Mode Of Payment", ...MONEY_AFTER_PAYMODE.map((c) => c.label), ...FLAGS.map((c) => `${c.label} (Yes/No)`)];
    const body = filtered.map((r, i) =>
      [i + 1, ...cols.map((c) => (c === "order_id" ? r.order_id : c === "order_type" ? niceType(r.order_type) : r[c]))]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [headers.join(","), ...body].join("\n");
  }, [filtered]);

  const totalColumns = 5 + MONEY.length + 1 + MONEY_AFTER_PAYMODE.length + FLAGS.length + 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Transaction Report — order-wise</h2>
          <p className="text-xs text-slate-500 mt-0.5">{filtered.length} of {rows.length} transactions · full money breakdown per order.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Order id / restaurant / customer…"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[240px]"
          />
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="transaction-report.csv"
            className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap"
          >
            ⬇ Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="text-sm whitespace-nowrap">
          <thead className="text-left text-[11px] uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-10 text-slate-500">Sr.</th>
              <th className="px-4 py-3 font-semibold bg-slate-50 text-slate-500">Order ID</th>
              <th className="px-4 py-3 font-semibold bg-slate-50 text-slate-500">Order Type</th>
              <th className="px-4 py-3 font-semibold bg-slate-50 text-slate-500">Restaurant Name</th>
              <th className="px-4 py-3 font-semibold bg-slate-50 text-slate-500">Customer Name</th>
              {MONEY.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-semibold text-right ${tintHead(c.tint)}`}>{c.label}</th>
              ))}
              <th className="px-4 py-3 font-semibold bg-slate-50 text-slate-500">Mode Of Payment</th>
              {MONEY_AFTER_PAYMODE.map((c) => (
                <th key={c.key} className={`px-4 py-3 font-semibold text-right ${tintHead(c.tint)}`}>{c.label}</th>
              ))}
              {FLAGS.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold text-center bg-slate-50 text-slate-500">{c.label}</th>
              ))}
              <th className="px-4 py-3 font-semibold bg-slate-50 text-slate-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={totalColumns} className="px-6 py-12 text-center text-slate-400 text-sm">No transactions for this filter.</td></tr>
            ) : pageRows.map((r, i) => (
              <tr key={r.order_id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-400 sticky left-0 bg-white z-10">{start + i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.order_id}</td>
                <td className="px-4 py-3 text-slate-800">{niceType(r.order_type)}</td>
                <td className="px-4 py-3 text-slate-800">{r.restaurant ?? "—"}</td>
                <td className="px-4 py-3 text-slate-800">{r.customer_name ?? "—"}</td>
                {MONEY.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-right tabular-nums ${tintCell(c.tint)}`}>{inr(r[c.key] as number)}</td>
                ))}
                <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">{r.payment_mode}</span></td>
                {MONEY_AFTER_PAYMODE.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-right tabular-nums font-medium ${tintCell(c.tint)}`}>{inr(r[c.key] as number)}</td>
                ))}
                {FLAGS.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-center"><YesNo v={String(r[c.key])} /></td>
                ))}
                <td className="px-4 py-3">
                  <Link href={`/dashboard/orders/${r.order_id}`} className="text-xs font-semibold text-blue-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-slate-500">
            Showing <span className="font-semibold text-slate-700">{start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)}</span> of <span className="font-semibold text-slate-700">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >« First</button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >‹ Prev</button>
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold">{safePage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >Next ›</button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >Last »</button>
          </div>
        </div>
      )}
    </div>
  );
}
