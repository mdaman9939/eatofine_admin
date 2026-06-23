import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TdsReportTable } from "../../../components/TdsReportTable";

interface TDSReport {
  tds_rate: number;
  threshold: number;
  financial_year_start: string | null;
  rows: Array<{
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
  }>;
}

export default async function TDSPage({ searchParams }: { searchParams: Promise<{ rate?: string; threshold?: string }> }) {
  const sp = await searchParams;
  const qs: string[] = [];
  if (sp.rate) qs.push(`rate=${sp.rate}`);
  if (sp.threshold) qs.push(`threshold=${sp.threshold}`);
  const data = await adminFetch<TDSReport>(`/admin/tds/report${qs.length ? `?${qs.join("&")}` : ""}`);

  // Coerce numeric fields — MongoDB returns null for absent values.
  data.tds_rate = Number(data.tds_rate ?? 0);
  data.threshold = Number(data.threshold ?? 0);
  for (const r of data.rows ?? []) {
    r.orders = Number(r.orders ?? 0);
    r.gross_payout = Number(r.gross_payout ?? 0);
    r.admin_commission_pct = Number(r.admin_commission_pct ?? 0);
    r.admin_cut = Number(r.admin_cut ?? 0);
    r.net_vendor_payout = Number(r.net_vendor_payout ?? 0);
    r.tds_amount = Number(r.tds_amount ?? 0);
    r.final_disbursement = Number(r.final_disbursement ?? 0);
  }

  const totals = data.rows.reduce(
    (acc, r) => ({
      orders: acc.orders + r.orders,
      gross: acc.gross + r.gross_payout,
      admin_cut: acc.admin_cut + r.admin_cut,
      net: acc.net + r.net_vendor_payout,
      tds: acc.tds + r.tds_amount,
      disburse: acc.disburse + r.final_disbursement,
    }),
    { orders: 0, gross: 0, admin_cut: 0, net: 0, tds: 0, disburse: 0 },
  );

  const vendorsAtRisk = data.rows.filter((r) => r.tds_applies).length;

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
              BRD §5.4 · Enhancements
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">TDS Deduction Reports</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              See how much tax is held back from each restaurant&apos;s earnings before payout, with a per-vendor breakdown of orders, commission and the final amount they receive.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href="/dashboard/tds/settings"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 hover:bg-white text-emerald-700 text-sm font-semibold px-4 py-2 shadow-sm hover:shadow transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317a1 1 0 011.35 0l.835.835a1 1 0 001.32.083l.99-.66a1 1 0 011.475.555l.34 1.13a1 1 0 00.97.71h1.18a1 1 0 01.97 1.265l-.34 1.13a1 1 0 00.555 1.21l1.04.52a1 1 0 010 1.79l-1.04.52a1 1 0 00-.555 1.21l.34 1.13a1 1 0 01-.97 1.265h-1.18a1 1 0 00-.97.71l-.34 1.13a1 1 0 01-1.475.555l-.99-.66a1 1 0 00-1.32.083l-.835.835a1 1 0 01-1.35 0l-.835-.835a1 1 0 00-1.32-.083l-.99.66a1 1 0 01-1.475-.555l-.34-1.13a1 1 0 00-.97-.71H4.49a1 1 0 01-.97-1.265l.34-1.13a1 1 0 00-.555-1.21l-1.04-.52a1 1 0 010-1.79l1.04-.52a1 1 0 00.555-1.21l-.34-1.13a1 1 0 01.97-1.265h1.18a1 1 0 00.97-.71l.34-1.13a1 1 0 011.475-.555l.99.66a1 1 0 001.32-.083l.835-.835zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Vendors reporting" value={data.rows.length} suffix={`across ${totals.orders} delivered orders`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 014-4h1m4-3a4 4 0 11-8 0 4 4 0 018 0zm7-4a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        } />
        <StatCard label="Gross payout" value={`₹${formatINR(totals.gross)}`} suffix="pre-deduction" accent="teal" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Admin commission" value={`₹${formatINR(totals.admin_cut)}`} suffix="deducted" accent="cyan" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3" />
          </svg>
        } />
        <StatCard label="TDS deducted" value={`₹${formatINR(totals.tds)}`} suffix={totals.tds > 0 ? `${vendorsAtRisk} of ${data.rows.length} vendor${vendorsAtRisk === 1 ? "" : "s"} @ ${data.tds_rate}%` : "below threshold across all vendors"} accent={totals.tds > 0 ? "rose" : "slate"} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18M7 17l4-4 4 4 5-7" />
          </svg>
        } />
      </div>

      {/* ── Payout flow visualization ─────────────────────────── */}
      {data.rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Payout composition</h2>
              <p className="text-xs text-slate-500 mt-0.5">How the gross payout is divided across vendors, commission, and TDS.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
            <Donut total={totals.gross} segments={[
              { label: "Disbursed", value: totals.disburse, color: "#10B981" },
              { label: "Admin commission", value: totals.admin_cut, color: "#06B6D4" },
              { label: "TDS", value: totals.tds, color: "#F43F5E" },
            ]} />

            <div className="space-y-4 min-w-0">
              <Legend label="Disbursed to vendors" value={totals.disburse} total={totals.gross} color="#10B981" />
              <Legend label="Admin commission" value={totals.admin_cut} total={totals.gross} color="#06B6D4" />
              <Legend label="TDS withheld" value={totals.tds} total={totals.gross} color="#F43F5E" />
            </div>
          </div>
        </div>
      )}

      {/* ── Vendor breakdown table (filter + export) ───────────── */}
      <TdsReportTable rows={data.rows} rate={data.tds_rate} threshold={data.threshold} />

      {/* ── Closing card — TDS computation flow ────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3v18h18M7 17l4-4 4 4 5-7" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              BRD §5.4 · Computation logic
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">How TDS is calculated per disbursement</h3>
            <p className="mt-1.5 text-sm text-white/75">
              Gross order revenue, less the admin commission, gives the net vendor payout. TDS is
              withheld at <span className="font-semibold text-white">{data.tds_rate}%</span> only if
              the net payout reaches the <span className="font-semibold text-white">₹{data.threshold.toLocaleString("en-IN")}</span> threshold
              (Section 194C). The remainder is what the vendor actually receives.
            </p>
            <pre className="mt-4 text-xs leading-relaxed text-white/95 font-mono bg-black/25 rounded-xl p-4 ring-1 ring-white/10 overflow-x-auto">
{`Net payout         = Gross − (Gross × commission%)
TDS                = Net payout ≥ threshold ? Net payout × ${data.tds_rate}% : 0
Final disbursement = Net payout − TDS`}
            </pre>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FlowStep step="1" title="Net payout" body="Subtract admin commission from gross order revenue." />
              <FlowStep step="2" title="TDS threshold" body={`Compare net payout to ₹${data.threshold.toLocaleString("en-IN")} ceiling per Section 194C.`} />
              <FlowStep step="3" title="Disbursement" body="Net payout minus TDS lands in the vendor's wallet." />
            </div>
            <p className="mt-4 text-xs text-white/60">
              Monthly TDS summary per vendor + CSV/Excel export for ITR filing — next phase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatINR(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function formatINRCompact(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

function FlowStep({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm p-3.5">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center">{step}</span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className="mt-2 text-xs text-white/70 leading-relaxed">{body}</p>
    </div>
  );
}

function Legend({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-slate-700">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
          {label}
        </span>
        <span className="text-sm font-bold text-slate-900 tabular-nums">₹{formatINR(value)}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden ring-1 ring-slate-200">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">{pct.toFixed(1)}% of gross</div>
    </div>
  );
}

function Donut({ total, segments }: { total: number; segments: Array<{ label: string; value: number; color: string }> }) {
  const size = 180;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = total > 0 ? (s.value / total) * c : 0;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-acc}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
        acc += len;
        return el;
      })}
      <text x={size / 2} y={size / 2 - 6} textAnchor="middle" className="fill-slate-500" fontSize="10" fontWeight="600" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Gross
      </text>
      <text x={size / 2} y={size / 2 + 16} textAnchor="middle" className="fill-slate-900" fontSize="22" fontWeight="700">
        ₹{formatINRCompact(total)}
      </text>
    </svg>
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
  accent: "emerald" | "teal" | "cyan" | "rose" | "slate";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
    cyan: { tile: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-700", bg: "from-cyan-50/60 to-white" },
    rose: { tile: "bg-rose-100", ring: "ring-rose-200", text: "text-rose-700", bg: "from-rose-50/60 to-white" },
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
