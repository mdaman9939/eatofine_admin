"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageButton, PageWindow } from "./PaginatedTable";

export interface OrderReportRow {
  order_id: number;
  order_type: string;
  restaurant: string | null;
  customer_name: string | null;
  total_item_amount: number;
  coupon_discount: number;
  admin_discount: number;
  total_discount: number;
  discounted_amount: number;
  gst_on_item: number;
  additional_charge: number;
  gst_on_additional: number;
  delivery_charge: number;
  delivery_gst: number;
  tips: number;
  situational_charges: number;
  situational_gst: number;
  net_payable: number;
  payment_method: string;
  order_status: string;
  delivered: boolean;
  canceled: boolean;
  refunded: boolean;
  created_at: string | null;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// Money columns in the exact order the client specified.
const MONEY: Array<{ key: keyof OrderReportRow; label: string }> = [
  { key: "total_item_amount", label: "Total Item Cost" },
  { key: "coupon_discount", label: "Restaurant Discount (Coupon)" },
  { key: "admin_discount", label: "Admin Discount" },
  { key: "total_discount", label: "Total Discount" },
  { key: "discounted_amount", label: "Net Item Value (After Discount)" },
  { key: "gst_on_item", label: "GST On Item Value" },
  { key: "additional_charge", label: "Additional Charge (Platform / Package / Convenience)" },
  { key: "gst_on_additional", label: "GST on Additional Charge" },
  { key: "delivery_charge", label: "Delivery Fee" },
  { key: "delivery_gst", label: "GST on Delivery Fee" },
  { key: "tips", label: "Deliverymen Tip" },
  { key: "situational_charges", label: "Situational Charges (Surge / Late night / Festival)" },
  { key: "situational_gst", label: "GST on Situational Charges" },
  { key: "net_payable", label: "Net Payable Amount By User" },
];

const ORDER_TYPE: Record<string, { label: string; tone: string }> = {
  delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  home_delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  take_away: { label: "Take Away", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  dine_in: { label: "Dine In", tone: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
};

function payLabel(m: string): string {
  const k = (m || "").toLowerCase();
  if (k === "cash_on_delivery" || k === "cash") return "COD";
  if (k === "wallet") return "Wallet";
  if (k.includes("digital") || k.includes("online") || k.includes("razor") || k.includes("stripe")) return "Online";
  return m.replace(/_/g, " ");
}

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

function YesNo({ yes, tone }: { yes: boolean; tone: "emerald" | "rose" | "fuchsia" }) {
  const on: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    fuchsia: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${yes ? on[tone] : "bg-slate-50 text-slate-500 border-slate-200"}`}>
      {yes ? "Yes" : "No"}
    </span>
  );
}

export function OrderReportTable({ rows, statusCounts }: { rows: OrderReportRow[]; statusCounts: Record<string, number> }) {
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

  const csv = useMemo(() => {
    const headers = [
      "Sr", "Order ID", "Order Type", "Restaurant", "Customer",
      ...MONEY.map((c) => c.label),
      "Mode Of Payment", "Order Delivered", "Order Canceled", "Order Refunded",
    ];
    const body = filtered.map((r, i) =>
      [
        i + 1, r.order_id, ORDER_TYPE[r.order_type]?.label ?? r.order_type, r.restaurant ?? "", r.customer_name ?? "",
        ...MONEY.map((c) => r[c.key]),
        payLabel(r.payment_method), r.delivered ? "Yes" : "No", r.canceled ? "Yes" : "No", r.refunded ? "Yes" : "No",
      ]
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
            Order Report <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span>
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Order ID / restaurant / customer…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]" />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="order-report.csv" className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-10">Sr.</th>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Order Type</th>
                <th className="px-4 py-3 font-semibold">Restaurant Name</th>
                <th className="px-4 py-3 font-semibold">Customer Name</th>
                {MONEY.map((c) => <th key={c.key} className="px-4 py-3 font-semibold text-right">{c.label}</th>)}
                <th className="px-4 py-3 font-semibold">Mode Of Payment</th>
                <th className="px-4 py-3 font-semibold text-center">Order Delivered</th>
                <th className="px-4 py-3 font-semibold text-center">Order Canceled</th>
                <th className="px-4 py-3 font-semibold text-center">Order Refunded</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={MONEY.length + 10} className="px-6 py-12 text-center text-slate-400 text-sm">No orders in this window.</td></tr>
              ) : pageRows.map((r, i) => {
                const ot = ORDER_TYPE[r.order_type] ?? { label: r.order_type, tone: "bg-slate-100 text-slate-600 ring-slate-200" };
                return (
                  <tr key={r.order_id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 sticky left-0 bg-white z-10">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.order_id}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${ot.tone}`}>{ot.label}</span></td>
                    <td className="px-4 py-3 text-slate-800">{r.restaurant ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-800">{r.customer_name ?? "—"}</td>
                    {MONEY.map((c) => <td key={c.key} className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r[c.key] as number)}</td>)}
                    <td className="px-4 py-3 text-slate-600 text-xs">{payLabel(r.payment_method)}</td>
                    <td className="px-4 py-3 text-center"><YesNo yes={r.delivered} tone="emerald" /></td>
                    <td className="px-4 py-3 text-center"><YesNo yes={r.canceled} tone="rose" /></td>
                    <td className="px-4 py-3 text-center"><YesNo yes={r.refunded} tone="fuchsia" /></td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${r.order_id}`} className="text-xs font-semibold text-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > pageSize && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700 tabular-nums">{(safePage - 1) * pageSize + 1}</span>
              {" – "}
              <span className="font-semibold text-slate-700 tabular-nums">{Math.min(safePage * pageSize, filtered.length)}</span>
              {" of "}
              <span className="font-semibold text-slate-700 tabular-nums">{filtered.length}</span> orders
            </div>
            <div className="inline-flex items-center gap-1">
              <PageButton disabled={safePage === 1} onClick={() => setPage(1)} label="« First" />
              <PageButton disabled={safePage === 1} onClick={() => setPage(safePage - 1)} label="‹ Prev" />
              <PageWindow current={safePage} total={totalPages} onJump={setPage} />
              <PageButton disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} label="Next ›" />
              <PageButton disabled={safePage === totalPages} onClick={() => setPage(totalPages)} label="Last »" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
