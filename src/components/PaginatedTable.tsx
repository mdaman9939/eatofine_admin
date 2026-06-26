"use client";

import React, { useMemo, useState } from "react";

export function PaginatedTable({
  headerRow,
  bodyRows,
  searchTexts,
  empty,
  pageSize = 10,
  searchable = false,
  colCount = 1,
}: {
  headerRow: React.ReactNode;
  bodyRows: React.ReactNode[];
  searchTexts?: string[];
  empty?: React.ReactNode;
  pageSize?: number;
  searchable?: boolean;
  colCount?: number;
}) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const filteredIdxs = useMemo(() => {
    const all = bodyRows.map((_, i) => i);
    if (!searchable || !query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter((i) => {
      const text = searchTexts?.[i] ?? "";
      return text.includes(q);
    });
  }, [bodyRows, query, searchable, searchTexts]);

  const totalPages = Math.max(1, Math.ceil(filteredIdxs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageIdxs = filteredIdxs.slice(startIdx, startIdx + pageSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {searchable && (
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search this table…"
              className="w-full md:w-80 pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
            {headerRow}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageIdxs.map((idx) => bodyRows[idx])}
            {filteredIdxs.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-6 py-12 text-center">
                  <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2a4 4 0 014-4h6m-6 0a4 4 0 01-4-4V5m4 6l-3-3m3 3l3-3" />
                    </svg>
                    <p className="text-sm font-medium">{empty || (query ? "No matches for your search." : "Nothing to show.")}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredIdxs.length > pageSize && (
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700 tabular-nums">{startIdx + 1}</span>
            {" – "}
            <span className="font-semibold text-slate-700 tabular-nums">{Math.min(startIdx + pageSize, filteredIdxs.length)}</span>
            {" of "}
            <span className="font-semibold text-slate-700 tabular-nums">{filteredIdxs.length}</span>
            {query && <span className="text-slate-400"> (filtered)</span>}
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
  );
}

export function PageButton({ disabled, onClick, label, active }: { disabled?: boolean; onClick: () => void; label: string; active?: boolean }) {
  const base = "cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-150 disabled:cursor-not-allowed";
  const variant = active
    ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm hover:from-emerald-500 hover:to-emerald-600"
    : disabled
      ? "bg-slate-50 text-slate-300 border border-slate-100"
      : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200";
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`${base} ${variant}`}>
      {label}
    </button>
  );
}

export function PageWindow({ current, total, onJump }: { current: number; total: number; onJump: (p: number) => void }) {
  const window: number[] = [];
  const left = Math.max(1, current - 2);
  const right = Math.min(total, current + 2);
  for (let i = left; i <= right; i++) window.push(i);
  return (
    <div className="inline-flex items-center gap-1 px-1">
      {window.map((n) => (
        <PageButton key={n} active={n === current} onClick={() => onJump(n)} label={n.toString()} />
      ))}
    </div>
  );
}
