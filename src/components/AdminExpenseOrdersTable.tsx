"use client";

import { useMemo, useState } from "react";

export interface AdminExpenseOrderRow {
  order_id: number;
  customer_name: string | null;
  delivery_man: string | null;
  order_type: string;
  expense_discount: number;
  expense_delivery: number;
  expense_bonus: number;
  expense_situational: number;
  total_expense: number;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function pctOf(part: number, whole: number): string {
  if (!whole) return "0.00% of total";
  return `${((part / whole) * 100).toFixed(2)}% of total`;
}

const ORDER_TYPE: Record<string, { label: string; tone: string }> = {
  delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  home_delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200" },
  take_away: { label: "Take Away", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  dine_in: { label: "Dine In", tone: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
};

const MONEY: Array<{ key: keyof AdminExpenseOrderRow; label: string }> = [
  { key: "expense_discount", label: "Expense on Discount" },
  { key: "expense_delivery", label: "Expense on Delivery Fee" },
  { key: "expense_bonus", label: "Expense on Bonus / Incentive" },
  { key: "expense_situational", label: "Expense on Situational Charge" },
  { key: "total_expense", label: "Total Expense" },
];

export function AdminExpenseOrdersTable({ rows }: { rows: AdminExpenseOrderRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        String(r.order_id).includes(q) ||
        (r.delivery_man ?? "").toLowerCase().includes(q) ||
        (r.customer_name ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // "Total as per filter" — category sums over the filtered set.
  const t = useMemo(() => {
    const s = { discount: 0, delivery: 0, bonus: 0, situational: 0, total: 0 };
    for (const r of filtered) {
      s.discount += Number(r.expense_discount) || 0;
      s.delivery += Number(r.expense_delivery) || 0;
      s.bonus += Number(r.expense_bonus) || 0;
      s.situational += Number(r.expense_situational) || 0;
      s.total += Number(r.total_expense) || 0;
    }
    return s;
  }, [filtered]);

  const csv = useMemo(() => {
    const headers = ["Sr", "Order ID", "Customer Name", "Delivery Man", "Order Type", ...MONEY.map((c) => c.label)];
    const body = filtered.map((r, i) =>
      [i + 1, r.order_id, r.customer_name ?? "", r.delivery_man ?? "", ORDER_TYPE[r.order_type]?.label ?? r.order_type, ...MONEY.map((c) => r[c.key])]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [headers.join(","), ...body].join("\n");
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Expense Breakdown — total as per filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Expense Breakdown <span className="text-xs font-normal text-slate-400">· total as per filter</span></h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="text-[11px] text-slate-500">Total Number of Orders</div>
            <div className="text-lg font-bold text-slate-900">{filtered.length}</div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="text-[11px] text-slate-500">Expense on Discount</div>
            <div className="text-lg font-bold text-slate-900">{inr(t.discount)}</div>
            <div className="text-[10px] text-slate-400">{pctOf(t.discount, t.total)}</div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="text-[11px] text-slate-500">Expense on Delivery Fee</div>
            <div className="text-lg font-bold text-slate-900">{inr(t.delivery)}</div>
            <div className="text-[10px] text-slate-400">{pctOf(t.delivery, t.total)}</div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="text-[11px] text-slate-500">Expense on Bonus / Incentive</div>
            <div className="text-lg font-bold text-slate-900">{inr(t.bonus)}</div>
            <div className="text-[10px] text-slate-400">{pctOf(t.bonus, t.total)}</div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="text-[11px] text-slate-500">Expense on Situational Charge</div>
            <div className="text-lg font-bold text-slate-900">{inr(t.situational)}</div>
            <div className="text-[10px] text-slate-400">{pctOf(t.situational, t.total)}</div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <div className="text-[11px] text-rose-600">Total Expense</div>
            <div className="text-lg font-bold text-rose-600">{inr(t.total)}</div>
            <div className="text-[10px] text-rose-500/70">100% of total</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Expense — Order-wise <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span></h2>
          <div className="flex items-center gap-3 flex-wrap">
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Order ID / delivery man / customer…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-rose-400 min-w-[220px]" />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="admin-expense-orders.csv" className="rounded-lg bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-400 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-10">Sr.</th>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Customer Name</th>
                <th className="px-4 py-3 font-semibold">Delivery Man</th>
                <th className="px-4 py-3 font-semibold">Order Type</th>
                {MONEY.map((c) => <th key={c.key} className={`px-4 py-3 font-semibold text-right ${c.key === "total_expense" ? "text-rose-600" : ""}`}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={MONEY.length + 5} className="px-6 py-12 text-center text-slate-400 text-sm">No expenses in this window.</td></tr>
              ) : pageRows.map((r, i) => {
                const ot = ORDER_TYPE[r.order_type] ?? { label: r.order_type, tone: "bg-slate-100 text-slate-600 ring-slate-200" };
                return (
                  <tr key={r.order_id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-400 sticky left-0 bg-white z-10">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">#{r.order_id}</td>
                    <td className="px-4 py-3 text-slate-800">{r.customer_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-800">{r.delivery_man ?? "—"}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${ot.tone}`}>{ot.label}</span></td>
                    {MONEY.map((c) => <td key={c.key} className={`px-4 py-3 text-right tabular-nums ${c.key === "total_expense" ? "font-semibold text-rose-600" : "text-slate-700"}`}>{inr(r[c.key] as number)}</td>)}
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
    </div>
  );
}
