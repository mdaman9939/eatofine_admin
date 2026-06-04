import React from "react";

interface ReportTemplateProps {
  badge?: string;
  title: string;
  description: string;
  /** KPI tiles at top */
  stats?: Array<{ label: string; value: string; hint?: string; accent?: "emerald" | "blue" | "amber" | "rose" | "slate" }>;
  /** Main report table */
  columns?: Array<{ key: string; label: string; align?: "left" | "right" | "center" }>;
  rows?: Array<Record<string, string | number | null | undefined>>;
  /** Optional CSV download href */
  csvHref?: string;
}

const PALETTE: Record<string, string> = {
  emerald: "from-emerald-50/60 ring-emerald-200",
  blue: "from-blue-50/60 ring-blue-200",
  amber: "from-amber-50/60 ring-amber-200",
  rose: "from-rose-50/60 ring-rose-200",
  slate: "from-slate-50/60 ring-slate-200",
};

/** Consistent layout for the 11 sub-report pages — same hero + stats + table
 *  shape, no copy-pasted boilerplate per page. Each report passes its
 *  own KPIs, columns, and rows. */
export function ReportTemplate({ badge, title, description, stats, columns, rows, csvHref }: ReportTemplateProps) {
  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> {badge ?? "SYSTEM · REPORT"}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">{description}</p>
          </div>
          {csvHref && (
            <a
              href={csvHref}
              download
              className="rounded-xl bg-white text-emerald-700 font-semibold text-sm px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
            >
              ⬇ Export CSV
            </a>
          )}
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(4, stats.length)} gap-4`}>
          {stats.map((s) => (
            <div key={s.label} className={`bg-gradient-to-b ${PALETTE[s.accent ?? "emerald"]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{s.label}</div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{s.value}</div>
              {s.hint && <div className="mt-0.5 text-xs text-slate-500">{s.hint}</div>}
            </div>
          ))}
        </div>
      )}

      {columns && rows && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">{rows.length} row{rows.length === 1 ? "" : "s"}.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`px-4 py-3 font-semibold ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">No data yet for this report.</td>
                  </tr>
                ) : rows.map((r, i) => (
                  <tr key={i} className="hover:bg-emerald-50/40">
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-4 py-3 text-slate-700 ${c.align === "right" ? "text-right tabular-nums" : c.align === "center" ? "text-center" : ""}`}
                      >
                        {r[c.key] === null || r[c.key] === undefined ? "—" : String(r[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
