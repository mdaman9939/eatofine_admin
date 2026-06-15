"use client";

import { useMemo, useState } from "react";

export interface IncentiveHistoryRow {
  id: number;
  dm_id: number | null;
  dm_name: string;
  zone_name: string | null;
  total_earning: number;
  claim_amount: number;
  status: string;
  created_at: string | null;
}

function inr(n: number) {
  return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border capitalize ${map[status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "approved" ? "bg-emerald-500" : status === "rejected" ? "bg-rose-500" : "bg-amber-500"}`} />
      {status}
    </span>
  );
}

export function IncentivesHistoryTable({ rows }: { rows: IncentiveHistoryRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.dm_name.toLowerCase().includes(q) || (r.zone_name ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">
          Delivery Man Incentives <span className="ml-1 text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{filtered.length}</span>
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search delivery man / zone…"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[240px]"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">SI</th>
              <th className="px-4 py-3 font-semibold">Delivery Man</th>
              <th className="px-4 py-3 font-semibold">Zone</th>
              <th className="px-4 py-3 font-semibold text-right">Total Earning</th>
              <th className="px-4 py-3 font-semibold text-right">Incentive</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">No incentive history yet.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id} className="hover:bg-emerald-50/40">
                <td className="px-6 py-3 font-mono text-xs text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.dm_name}</td>
                <td className="px-4 py-3 text-slate-600">{r.zone_name ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-800">{inr(r.total_earning)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{inr(r.claim_amount)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
