import React from "react";
import { PaginatedTable } from "./PaginatedTable";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export function TablePage<T>({
  title,
  subtitle,
  description,
  columns,
  rows,
  rowKey,
  actions,
  empty = "Nothing to show.",
  pageSize = 10,
  searchable = true,
  getSearchText,
  hero = true,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  actions?: React.ReactNode;
  empty?: React.ReactNode;
  pageSize?: number;
  searchable?: boolean;
  getSearchText?: (row: T) => string;
  hero?: boolean;
}) {
  const headerRow = (
    <tr>
      {columns.map((c) => (
        <th key={c.header} className={`px-4 py-3 font-semibold ${c.className ?? ""}`}>
          {c.header}
        </th>
      ))}
    </tr>
  );

  const bodyRows = rows.map((r) => (
    <tr key={rowKey(r)} className="hover:bg-emerald-50/40 transition-colors">
      {columns.map((c) => (
        <td key={c.header} className={`px-4 py-3 text-slate-800 ${c.className ?? ""}`}>
          {c.cell(r)}
        </td>
      ))}
    </tr>
  ));

  const searchTexts = rows.map((r) =>
    getSearchText ? getSearchText(r) : JSON.stringify(r).toLowerCase()
  );

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {hero && (
        <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
          <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
                <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
                Admin · Data table
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
              {(description || subtitle) && (
                <p className="mt-2 text-sm text-white/80 leading-relaxed">
                  {description || subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total</div>
                <div className="text-lg font-bold tabular-nums">{rows.length.toLocaleString("en-IN")}</div>
                {subtitle && description && (
                  <div className="text-[11px] text-white/70">{subtitle}</div>
                )}
              </div>
              {actions && <div className="flex gap-2">{actions}</div>}
            </div>
          </div>
        </div>
      )}

      <PaginatedTable
        headerRow={headerRow}
        bodyRows={bodyRows}
        searchTexts={searchTexts}
        empty={empty}
        pageSize={pageSize}
        searchable={searchable}
        colCount={columns.length}
      />
    </div>
  );
}

export function StatusBadge({
  value,
  trueLabel = "Active",
  falseLabel = "Inactive",
}: {
  value: boolean | null | undefined;
  trueLabel?: string;
  falseLabel?: string;
}) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        {trueLabel}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {falseLabel}
    </span>
  );
}

export function fmtDate(d: string | null | Date | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export function fmtMoney(n: number | null | undefined, prefix = "₹") {
  if (n === null || n === undefined) return "—";
  return `${prefix}${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
