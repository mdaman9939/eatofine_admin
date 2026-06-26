"use client";

import { useMemo, useState } from "react";
import { PageButton, PageWindow } from "./PaginatedTable";

export interface WalletRow {
  id: number;
  name: string;
  phone: string | null;
  balance: number;
  total_earning?: number;
  collected_cash?: number;
}
export interface WalletTab {
  key: string;
  label: string;
  totalBalance: number;
  holders: number;
  count: number;
  rows: WalletRow[];
  extraCols: Array<{ key: string; label: string }>;
}

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Admin "Wallets" — one component, three sub-tabs (Customer / Restaurant /
 *  Delivery-Man). Each tab shows total balance held, how many accounts hold a
 *  balance, and a searchable per-account table. */
const PAGE_SIZE = 10;

export function WalletTabs({ tabs }: { tabs: WalletTab[] }) {
  const [active, setActive] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const tab = tabs[active];

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tab.rows;
    return tab.rows.filter(
      (r) => r.name.toLowerCase().includes(q) || String(r.id).includes(q) || (r.phone ?? "").toLowerCase().includes(q),
    );
  }, [tab, search]);

  // Paginate the (filtered) rows; clamp the page so a shrunk filter never lands
  // on an empty page.
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Sub-component switcher */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setActive(i); setSearch(""); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              i === active
                ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-500/25"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            {t.label} <span className="ml-1 opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Stats for the active tab */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Total balance held" value={inr(tab.totalBalance)} accent="emerald" />
        <Stat label="Accounts with balance" value={tab.holders.toLocaleString("en-IN")} accent="blue" />
        <Stat label="Total accounts" value={tab.count.toLocaleString("en-IN")} accent="slate" />
      </div>

      {/* Per-account table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{tab.label}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{rows.length} of {tab.rows.length} accounts</p>
          </div>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="🔍 Name / ID / phone…"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 min-w-[220px]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold w-16">#</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                {tab.extraCols.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold text-right">{c.label}</th>
                ))}
                <th className="px-4 py-3 font-semibold text-right">Wallet Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={4 + tab.extraCols.length} className="px-6 py-12 text-center text-slate-400 text-sm">No wallets to show.</td></tr>
              ) : pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{r.phone ?? "—"}</td>
                  {tab.extraCols.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {inr(Number((r as unknown as Record<string, unknown>)[c.key] ?? 0))}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">{inr(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > PAGE_SIZE && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700 tabular-nums">{startIdx + 1}</span>
              {" – "}
              <span className="font-semibold text-slate-700 tabular-nums">{Math.min(startIdx + PAGE_SIZE, rows.length)}</span>
              {" of "}
              <span className="font-semibold text-slate-700 tabular-nums">{rows.length}</span>
              {search.trim() && <span className="text-slate-400"> (filtered)</span>}
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

function Stat({ label, value, accent }: { label: string; value: string; accent: "emerald" | "blue" | "slate" }) {
  const p: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    blue: "from-blue-50/60 ring-blue-200",
    slate: "from-slate-50 ring-slate-200",
  };
  return (
    <div className={`bg-gradient-to-b ${p[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
