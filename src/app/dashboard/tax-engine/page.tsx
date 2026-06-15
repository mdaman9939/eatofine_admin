import { adminFetch } from "../../../lib/api";
import { TaxCalculator } from "../../../components/TaxCalculator";
import { TaxRowEditor } from "../../../components/TaxRowEditor";
import { CreateForm } from "../../../components/CreateForm";

interface Tax {
  id: number;
  charge_head: string;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  hsn_sac: string | null;
  status: boolean;
  configurable: boolean;
}

const MAX_GST_FOR_BAR = 30; // visual scale for the rate bar

export default async function TaxEnginePage() {
  const taxes = await adminFetch<Tax[]>("/admin/tax-engine/master");

  const configurable = taxes.filter((t) => t.configurable && t.gst_rate > 0).length;
  const exempt = taxes.filter((t) => t.gst_rate === 0).length;
  const avgRate = taxes.length
    ? taxes.filter((t) => t.gst_rate > 0).reduce((a, t) => a + t.gst_rate, 0) /
      Math.max(1, taxes.filter((t) => t.gst_rate > 0).length)
    : 0;
  const maxRate = taxes.length ? Math.max(...taxes.map((t) => t.gst_rate)) : 0;

  // Sort: highest rate first (so the matrix tells a story).
  const sorted = [...taxes].sort((a, b) => b.gst_rate - a.gst_rate);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              BRD §5.3 · Enhancements
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">GST Engine</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Dynamic GST master with CGST/SGST split for intra-state and IGST for inter-state
              orders. Each charge head maps to its own HSN/SAC code so invoices stay GSTN-compliant.
              Use the live calculator below to test the slab + GST chain end-to-end.
            </p>
          </div>
          <CreateForm
            path="/tax-engine/master"
            title="Add charge head"
            fields={[
              { name: "charge_head", label: "Charge head", type: "text", required: true, placeholder: "Service Tax" },
              { name: "gst_rate", label: "GST rate %", type: "number", defaultValue: 18 },
              { name: "cgst", label: "CGST %", type: "number", defaultValue: 9 },
              { name: "sgst", label: "SGST %", type: "number", defaultValue: 9 },
              { name: "igst", label: "IGST %", type: "number", defaultValue: 18 },
              { name: "hsn_sac", label: "HSN / SAC code", type: "text" },
              { name: "configurable", label: "Configurable (allow future edits)", type: "checkbox", defaultValue: true },
            ]}
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total charge heads" value={taxes.length} suffix={`${configurable} configurable`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        } />
        <StatCard label="Avg GST" value={`${avgRate.toFixed(1)}%`} suffix="across taxable heads" accent="teal" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-6 4h4m2 5l4-4M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2h-2" />
          </svg>
        } />
        <StatCard label="Max rate" value={`${maxRate}%`} suffix="highest slab" accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        } />
        <StatCard label="Exempt items" value={exempt} suffix={exempt === 1 ? "charge head" : "charge heads"} accent="slate" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
      </div>

      {/* ── GST Applicability Matrix ───────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">GST Applicability Matrix</h2>
            <p className="text-xs text-slate-500 mt-0.5">CGST + SGST for intra-state, IGST for inter-state. Sort: highest rate first.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {taxes.length} {taxes.length === 1 ? "head" : "heads"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Charge head</th>
                <th className="px-4 py-3 font-semibold">GST rate</th>
                <th className="px-4 py-3 font-semibold text-right">CGST</th>
                <th className="px-4 py-3 font-semibold text-right">SGST</th>
                <th className="px-4 py-3 font-semibold text-right">IGST</th>
                <th className="px-4 py-3 font-semibold">HSN / SAC</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold text-right relative">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((t) => (
                <tr key={t.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{t.charge_head}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">#{t.id}</div>
                  </td>
                  <td className="px-4 py-4 w-[180px]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200">
                        <div
                          className={`h-full rounded-full ${barColor(t.gst_rate)}`}
                          style={{ width: `${Math.min(100, (t.gst_rate / MAX_GST_FOR_BAR) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-900 tabular-nums w-12 text-right">{t.gst_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-700 tabular-nums">{t.cgst}%</td>
                  <td className="px-4 py-4 text-right text-slate-700 tabular-nums">{t.sgst}%</td>
                  <td className="px-4 py-4 text-right text-slate-700 tabular-nums">{t.igst}%</td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-600">{t.hsn_sac ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-4">
                    <TypeChip rate={t.gst_rate} configurable={t.configurable} />
                  </td>
                  <td className="px-4 py-4 text-right relative">
                    <TaxRowEditor tax={t} />
                  </td>
                </tr>
              ))}
              {taxes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m-6 4h6m-6 4h4m2 5l4-4M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2h-2" />
                      </svg>
                      <p className="text-sm font-medium">No charge heads yet</p>
                      <p className="text-xs">Click &quot;+ Add charge head&quot; above to define your first GST rule.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── GST rate distribution ──────────────────────────────── */}
      {taxes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">GST rate distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">How your {taxes.length} charge head{taxes.length === 1 ? "" : "s"} fall across the GST brackets.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
            <GstRateDonut taxes={taxes} />

            <div className="space-y-2.5">
              {buildRateBuckets(taxes).map((b) => {
                const sharePct = (b.heads.length / taxes.length) * 100;
                return (
                  <div key={b.label}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: b.color }} />
                        <span className="font-semibold text-slate-800">{b.label}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500 truncate">{b.heads.map((h) => h.charge_head).join(", ")}</span>
                      </span>
                      <span className="text-xs font-mono text-slate-700 font-semibold shrink-0">
                        {b.heads.length} · {sharePct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200">
                      <div className="h-full rounded-full" style={{ width: `${sharePct}%`, background: b.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Live calculator ────────────────────────────────────── */}
      <TaxCalculator />

      {/* ── Closing: Intra-state vs Inter-state explainer ──────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              How GST splits per order
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">Intra-state vs. inter-state</h3>
            <p className="mt-1.5 text-sm text-white/75">
              Same GST rate, different distribution. When customer state matches restaurant state,
              GST splits half each into CGST and SGST. When they differ, the full amount goes into a
              single IGST line. The total tax to the customer is identical either way.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FlowCard
                title="Intra-state"
                subtitle="Same state · CGST + SGST"
                badge="Split 50/50"
                rate={18}
                segments={[
                  { label: "CGST", value: 9, color: "bg-emerald-400" },
                  { label: "SGST", value: 9, color: "bg-teal-400" },
                ]}
              />
              <FlowCard
                title="Inter-state"
                subtitle="Different states · IGST only"
                badge="Single line"
                rate={18}
                segments={[{ label: "IGST", value: 18, color: "bg-cyan-400" }]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Group charge heads into the standard Indian GST brackets so the donut
// reads as one slice per bracket. Colors match the inline rate-bar palette.
function buildRateBuckets(taxes: Tax[]): Array<{ label: string; color: string; heads: Tax[] }> {
  const buckets: Array<{ label: string; min: number; max: number; color: string }> = [
    { label: "Exempt (0%)",   min: 0,    max: 0,    color: "#94A3B8" },
    { label: "0–5%",          min: 0.01, max: 5,    color: "#34D399" },
    { label: "5–12%",         min: 5.01, max: 12,   color: "#14B8A6" },
    { label: "12–18%",        min: 12.01, max: 18,  color: "#06B6D4" },
    { label: "18–28%",        min: 18.01, max: 28,  color: "#F59E0B" },
    { label: "28%+",          min: 28.01, max: Infinity, color: "#F43F5E" },
  ];
  return buckets
    .map((b) => ({
      label: b.label,
      color: b.color,
      heads: taxes.filter((t) => t.gst_rate >= b.min && t.gst_rate <= b.max),
    }))
    .filter((b) => b.heads.length > 0);
}

function GstRateDonut({ taxes }: { taxes: Tax[] }) {
  const buckets = buildRateBuckets(taxes);
  const total = taxes.length;
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 86;
  const innerR = 50;
  let cumulative = 0;

  function arcPath(startFrac: number, endFrac: number): string {
    const startAngle = startFrac * 2 * Math.PI - Math.PI / 2;
    const endAngle = endFrac * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(endAngle);
    const yi1 = cy + innerR * Math.sin(endAngle);
    const xi2 = cx + innerR * Math.cos(startAngle);
    const yi2 = cy + innerR * Math.sin(startAngle);
    const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={(r + innerR) / 2} fill="none" stroke="#F1F5F9" strokeWidth={r - innerR} />
      {buckets.map((b, i) => {
        const startFrac = cumulative / total;
        const endFrac = (cumulative + b.heads.length) / total;
        cumulative += b.heads.length;
        return (
          <path
            key={i}
            d={arcPath(startFrac, endFrac)}
            fill={b.color}
            opacity={0.95}
            stroke="white"
            strokeWidth={2}
            className="transition-opacity hover:opacity-100"
          >
            <title>{b.label}: {b.heads.length} of {total} ({((b.heads.length / total) * 100).toFixed(1)}%)</title>
          </path>
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-500" fontSize="10" fontWeight="600" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Charge heads
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="fill-slate-900" fontSize="22" fontWeight="700">
        {total}
      </text>
    </svg>
  );
}

function barColor(rate: number): string {
  if (rate === 0) return "bg-slate-300";
  if (rate <= 5) return "bg-emerald-400";
  if (rate <= 12) return "bg-teal-500";
  if (rate <= 18) return "bg-cyan-500";
  if (rate <= 28) return "bg-amber-500";
  return "bg-rose-500";
}

function TypeChip({ rate, configurable }: { rate: number; configurable: boolean }) {
  if (rate === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 ring-1 ring-slate-200 px-2 py-0.5 rounded-md">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Exempt
      </span>
    );
  }
  if (configurable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-md">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Configurable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 ring-1 ring-slate-300 px-2 py-0.5 rounded-md">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
      Fixed
    </span>
  );
}

function FlowCard({
  title,
  subtitle,
  badge,
  rate,
  segments,
}: {
  title: string;
  subtitle: string;
  badge: string;
  rate: number;
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-white/65 mt-0.5">{subtitle}</div>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded-md bg-white/90 text-emerald-700">{badge}</span>
      </div>

      {/* Stacked bar showing the split */}
      <div className="mt-3 h-2.5 rounded-full overflow-hidden ring-1 ring-white/10 bg-white/5">
        <div className="flex h-full">
          {segments.map((s) => (
            <div key={s.label} className={s.color} style={{ width: `${(s.value / rate) * 100}%` }} title={`${s.label}: ${s.value}%`} />
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-white/75">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-sm ${s.color}`} />
            {s.label} <span className="font-mono">{s.value}%</span>
          </span>
        ))}
        <span className="font-semibold text-white">Total {rate}%</span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent: "emerald" | "teal" | "amber" | "slate";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white" },
    slate: { tile: "bg-slate-100", ring: "ring-slate-200", text: "text-slate-700", bg: "from-slate-50 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
        <span className={`w-10 h-10 rounded-xl ${p.tile} ring-1 ${p.ring} ${p.text} flex items-center justify-center shadow-sm`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
