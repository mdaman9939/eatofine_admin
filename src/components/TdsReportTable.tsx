"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TablePager } from "./TablePager";

export interface TdsRow {
  restaurant_id: number;
  restaurant: string | null;
  vendor_id: number | null;
  orders: number;
  gross_payout: number;
  admin_commission_pct: number;
  admin_cut: number;
  net_vendor_payout: number;
  tds_applies: boolean;
  tds_amount: number;
  final_disbursement: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function TdsReportTable({ rows, rate, threshold }: { rows: TdsRow[]; rate: number; threshold: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  const [tdsOnly, setTdsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [rateInput, setRateInput] = useState(String(rate));
  const [thrInput, setThrInput] = useState(String(threshold));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (tdsOnly && !r.tds_applies) return false;
      if (!q) return true;
      return (r.restaurant ?? "").toLowerCase().includes(q) || String(r.vendor_id ?? "").includes(q) || String(r.restaurant_id).includes(q);
    });
  }, [rows, search, tdsOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totals = useMemo(
    () => filtered.reduce(
      (a, r) => ({
        orders: a.orders + r.orders,
        gross: a.gross + r.gross_payout,
        admin_cut: a.admin_cut + r.admin_cut,
        net: a.net + r.net_vendor_payout,
        tds: a.tds + r.tds_amount,
        disburse: a.disburse + r.final_disbursement,
      }),
      { orders: 0, gross: 0, admin_cut: 0, net: 0, tds: 0, disburse: 0 },
    ),
    [filtered],
  );

  function applyRateThreshold() {
    const next = new URLSearchParams(params.toString());
    if (rateInput.trim()) next.set("rate", rateInput.trim()); else next.delete("rate");
    if (thrInput.trim()) next.set("threshold", thrInput.trim()); else next.delete("threshold");
    router.push(`${pathname}?${next.toString()}`);
  }

  const csv = useMemo(() => {
    const head = ["Restaurant", "Vendor #", "Orders", "Gross", "Admin commission %", "Admin cut", "Net payout", "TDS applies", "TDS amount", "Final disbursement"];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = filtered.map((r) => [
      r.restaurant ?? `#${r.restaurant_id}`, r.vendor_id ?? "", r.orders,
      r.gross_payout.toFixed(2), r.admin_commission_pct, r.admin_cut.toFixed(2),
      r.net_vendor_payout.toFixed(2), r.tds_applies ? "yes" : "no",
      r.tds_amount.toFixed(2), r.final_disbursement.toFixed(2),
    ].map(esc).join(","));
    return [head.join(","), ...body].join("\n");
  }, [filtered]);

  const cls = "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Filter + export bar */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Vendor-wise TDS breakdown</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sorted by gross payout. TDS applies once net payout ≥ threshold.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Rate %</span>
            <input type="number" value={rateInput} onChange={(e) => setRateInput(e.target.value)} className={`${cls} w-20 mt-0.5`} />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Threshold ₹</span>
            <input type="number" value={thrInput} onChange={(e) => setThrInput(e.target.value)} className={`${cls} w-28 mt-0.5`} />
          </label>
          <button type="button" onClick={applyRateThreshold} className="rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold px-3 py-1.5">Apply</button>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Vendor / restaurant…" className={`${cls} min-w-[180px]`} />
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 select-none cursor-pointer px-2 py-1.5">
            <input type="checkbox" checked={tdsOnly} onChange={(e) => { setTdsOnly(e.target.checked); setPage(1); }} /> TDS only
          </label>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="tds-report.csv"
            className="rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-4 py-1.5 whitespace-nowrap"
          >
            ⬇ Export CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Restaurant</th>
              <th className="px-4 py-3 font-semibold">Vendor #</th>
              <th className="px-4 py-3 font-semibold text-right">Orders</th>
              <th className="px-4 py-3 font-semibold text-right">Gross ₹</th>
              <th className="px-4 py-3 font-semibold text-right">Admin cut ₹</th>
              <th className="px-4 py-3 font-semibold text-right">Net payout ₹</th>
              <th className="px-4 py-3 font-semibold text-right">TDS ₹</th>
              <th className="px-4 py-3 font-semibold text-right">Final disbursement ₹</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((r) => (
              <tr key={r.restaurant_id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {initials(r.restaurant ?? `#${r.restaurant_id}`)}
                    </span>
                    <span className="font-medium text-slate-800 truncate">{r.restaurant ?? `#${r.restaurant_id}`}</span>
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-slate-500">{r.vendor_id ?? "—"}</td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-700">{r.orders}</td>
                <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">{r.gross_payout.toFixed(2)}</td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-700">
                  <span>{r.admin_cut.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 ml-1">({r.admin_commission_pct}%)</span>
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-700">{r.net_vendor_payout.toFixed(2)}</td>
                <td className="px-4 py-4 text-right">
                  {r.tds_applies ? (
                    <span className="inline-flex items-center gap-1 text-rose-700 font-semibold tabular-nums">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                      −{r.tds_amount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      below threshold
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right tabular-nums font-bold text-emerald-700">{r.final_disbursement.toFixed(2)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">No vendors match this filter.</td>
              </tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="border-t-2 border-slate-200">
              <tr className="bg-slate-50">
                <td className="px-6 py-3 font-bold text-slate-700" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">{totals.orders}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">₹{totals.gross.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">₹{totals.admin_cut.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">₹{totals.net.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-rose-700">−₹{totals.tds.toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">₹{totals.disburse.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <TablePager page={safePage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPage={setPage} filtered={!!search || tdsOnly} />
    </div>
  );
}
