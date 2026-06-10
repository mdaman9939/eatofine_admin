"use client";

import { useMemo, useState } from "react";

export interface DisbRow {
  id: number;
  recipient: string | null;
  type: string;
  amount: number;
  status: string;
  payment_method?: string;
  created_at: string | null;
  disbursement_id?: string | null;
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

const COMPLETED = new Set(["disbursed", "completed"]);
const CANCELED = new Set(["canceled", "cancelled"]);

function StatCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "rose" }) {
  const map = { emerald: "text-emerald-600", amber: "text-amber-600", rose: "text-rose-600" } as const;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
      <div className={`text-2xl font-bold ${map[tone]}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function DisbursementDetailsTable({ restaurant, deliveryman }: { restaurant: DisbRow[]; deliveryman: DisbRow[] }) {
  const [tab, setTab] = useState<"restaurant" | "deliveryman">("restaurant");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const all = tab === "restaurant" ? restaurant : deliveryman;
  const statuses = useMemo(() => Array.from(new Set(all.map((r) => r.status))), [all]);

  const pendingAmt = all.filter((r) => r.status === "pending" || r.status === "processing").reduce((s, r) => s + r.amount, 0);
  const completedAmt = all.filter((r) => COMPLETED.has(r.status)).reduce((s, r) => s + r.amount, 0);
  const canceledAmt = all.filter((r) => CANCELED.has(r.status)).reduce((s, r) => s + r.amount, 0);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (r) =>
        (!status || r.status === status) &&
        (!q || String(r.id).includes(q) || (r.disbursement_id ?? "").toLowerCase().includes(q) || (r.recipient ?? "").toLowerCase().includes(q)),
    );
  }, [all, search, status]);

  const csv = useMemo(() => {
    const head = "sl,id,recipient,created_at,amount,payment_method,status";
    const body = rows.map((r, i) =>
      [i + 1, r.disbursement_id ?? r.id, r.recipient ?? "", r.created_at ?? "", r.amount, r.payment_method ?? "cash", r.status]
        .map((v) => {
          const s = v == null ? "" : String(v);
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    return [head, ...body].join("\n");
  }, [rows]);

  const inputCls = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500";
  const infoLabel = tab === "restaurant" ? "Restaurant Info" : "Delivery Man Info";

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["restaurant", "deliveryman"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setStatus(""); setSearch(""); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t ? "bg-emerald-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
          >
            {t === "restaurant" ? "Restaurant Disbursement" : "Delivery Man Disbursement"}
          </button>
        ))}
      </div>

      {/* Per-type stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Pending Disbursements" value={inr(pendingAmt)} tone="emerald" />
        <StatCard label="Completed Disbursements" value={inr(completedAmt)} tone="amber" />
        <StatCard label="Canceled Transactions" value={inr(canceledAmt)} tone="rose" />
      </div>

      {/* List card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            Total Disbursements <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{rows.length}</span>
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
              <option value="">All status</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Search by id / name…" className={`${inputCls} min-w-[200px]`} />
            <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download={`disbursements-${tab}.csv`} className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-2 whitespace-nowrap">⬇ Export</a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">SI</th>
                <th className="px-4 py-3 font-semibold">Id</th>
                <th className="px-4 py-3 font-semibold">{infoLabel}</th>
                <th className="px-4 py-3 font-semibold">Created At</th>
                <th className="px-4 py-3 font-semibold text-right">Disburse Amount</th>
                <th className="px-4 py-3 font-semibold">Payment Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">No disbursements found.</td></tr>
              ) : rows.map((r, i) => (
                <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.disbursement_id ?? `#${r.id}`}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{r.recipient ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.amount)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs capitalize">{(r.payment_method ?? "cash").replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${COMPLETED.has(r.status) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : CANCELED.has(r.status) ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                      {r.status}
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
