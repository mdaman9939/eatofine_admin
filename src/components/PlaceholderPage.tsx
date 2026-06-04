import React from "react";

interface BulletItem {
  title: string;
  description?: string;
  meta?: string;
  icon?: React.ReactNode;
}

interface InfoCard {
  label: string;
  value: string;
  hint?: string;
  accent?: "emerald" | "amber" | "blue" | "rose" | "slate";
}

interface PlaceholderPageProps {
  badge?: string;
  title: string;
  description: string;
  iconBg?: string;
  stats?: InfoCard[];
  /** A short bullet list explaining what the page WILL do once data is wired. */
  capabilities?: BulletItem[];
  /** Example mock rows to show the intended layout. */
  exampleRows?: Array<Record<string, string | number>>;
  exampleColumns?: Array<{ key: string; label: string; align?: "left" | "right" | "center" }>;
  /** Right-side info column — what configures this, related modules, etc. */
  infoSections?: Array<{ title: string; body: React.ReactNode }>;
  /** Optional action button label + onClick (server-action friendly via form). */
  primaryActionLabel?: string;
}

/**
 * A consistent, branded "page is configured but data flow is in progress"
 * shell. Used for sidebar items in the FEATURE_INVENTORY checklist where the
 * Next.js page should exist now so navigation works, but full CRUD wiring
 * lands in the next iteration. Keeps every gap-fill page looking the same
 * instead of 25 ad-hoc placeholders that visually drift apart.
 */
export function PlaceholderPage({
  badge,
  title,
  description,
  stats,
  capabilities,
  exampleRows,
  exampleColumns,
  infoSections,
  primaryActionLabel,
}: PlaceholderPageProps) {
  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              {badge ?? "Module"}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">{description}</p>
          </div>
          {primaryActionLabel && (
            <button
              type="button"
              className="rounded-xl bg-white text-emerald-700 font-semibold text-sm px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
            >
              {primaryActionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(4, stats.length)} gap-4`}>
          {stats.map((s) => (
            <StatTile key={s.label} {...s} />
          ))}
        </div>
      )}

      {/* Body: two columns when there's an info column, single otherwise */}
      <div className={`grid gap-6 ${infoSections && infoSections.length > 0 ? "lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
        <div className="space-y-6">
          {capabilities && capabilities.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-base font-semibold text-slate-900">Capabilities</h2>
                <p className="text-xs text-slate-500 mt-0.5">What this module is designed to do.</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {capabilities.map((c) => (
                  <li key={c.title} className="flex items-start gap-3 px-6 py-3">
                    <span className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center ring-1 ring-emerald-200 shrink-0">
                      {c.icon ?? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-slate-900">{c.title}</div>
                      {c.description && <div className="text-xs text-slate-500 mt-0.5">{c.description}</div>}
                    </div>
                    {c.meta && <span className="text-[11px] text-slate-400 shrink-0">{c.meta}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {exampleRows && exampleRows.length > 0 && exampleColumns && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Sample data</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mock rows showing the layout. Live data wires in once the backend endpoint is implemented.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Preview
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      {exampleColumns.map((col) => (
                        <th
                          key={col.key}
                          className={`px-4 py-3 font-semibold ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exampleRows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {exampleColumns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-4 py-3 text-slate-700 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                          >
                            {String(row[col.key] ?? "—")}
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

        {infoSections && infoSections.length > 0 && (
          <div className="space-y-4">
            {infoSections.map((s) => (
              <div key={s.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900">{s.title}</h3>
                <div className="text-xs text-slate-600 leading-relaxed mt-2 space-y-2">{s.body}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, hint, accent = "emerald" }: InfoCard) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200 text-emerald-700",
    amber: "from-amber-50/60 ring-amber-200 text-amber-700",
    blue: "from-blue-50/60 ring-blue-200 text-blue-700",
    rose: "from-rose-50/60 ring-rose-200 text-rose-700",
    slate: "from-slate-50/60 ring-slate-200 text-slate-700",
  };
  return (
    <div className={`relative bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
