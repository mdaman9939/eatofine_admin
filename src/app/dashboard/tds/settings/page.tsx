import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { TdsSettingsForm } from "../../../../components/TdsSettingsForm";

interface TdsSettings {
  id: number;
  default_rate: number;
  threshold: number;
  section_code: string;
  financial_year_start: string;
  status: boolean;
  updated_by: string | null;
  updated_at: string | null;
}

export default async function TdsSettingsPage() {
  const settings = await adminFetch<TdsSettings>("/admin/tds/settings");

  // Coerce numeric fields — MongoDB returns null for absent values.
  settings.default_rate = Number(settings.default_rate ?? 0);
  settings.threshold = Number(settings.threshold ?? 0);

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
              BRD §5.4.1 · Configuration
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">TDS Settings</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Default TDS rate, threshold, and Section code used by the disbursement engine and the
              TDS report. Changes take effect from the financial-year-start date onward.
            </p>
          </div>
          <Link
            href="/dashboard/tds"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 hover:bg-white text-emerald-700 text-sm font-semibold px-4 py-2 shadow-sm hover:shadow transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to reports
          </Link>
        </div>
      </div>

      {/* ── Current values summary ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Current rate" value={`${settings.default_rate}%`} suffix={`Section ${settings.section_code}`} accent="emerald" />
        <SummaryCard label="Threshold" value={`₹${settings.threshold.toLocaleString("en-IN")}`} suffix="per-vendor floor" accent="teal" />
        <SummaryCard
          label="FY start"
          value={settings.financial_year_start ? new Date(settings.financial_year_start).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
          suffix={settings.financial_year_start ? new Date(settings.financial_year_start).toLocaleDateString("en-IN", { year: "numeric" }) : "not set"}
          accent="cyan"
        />
        <SummaryCard
          label="Status"
          value={settings.status ? "Active" : "Paused"}
          suffix={settings.status ? "TDS engine is on" : "no withholding"}
          accent={settings.status ? "emerald" : "slate"}
          dot
        />
      </div>

      {/* ── Settings form ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-700 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317a1 1 0 011.35 0l.835.835a1 1 0 001.32.083l.99-.66a1 1 0 011.475.555l.34 1.13a1 1 0 00.97.71h1.18a1 1 0 01.97 1.265l-.34 1.13a1 1 0 00.555 1.21l1.04.52a1 1 0 010 1.79l-1.04.52a1 1 0 00-.555 1.21l.34 1.13a1 1 0 01-.97 1.265h-1.18a1 1 0 00-.97.71l-.34 1.13a1 1 0 01-1.475.555l-.99-.66a1 1 0 00-1.32.083l-.835.835a1 1 0 01-1.35 0l-.835-.835a1 1 0 00-1.32-.083l-.99.66a1 1 0 01-1.475-.555l-.34-1.13a1 1 0 00-.97-.71H4.49a1 1 0 01-.97-1.265l.34-1.13a1 1 0 00-.555-1.21l-1.04-.52a1 1 0 010-1.79l1.04-.52a1 1 0 00.555-1.21l-.34-1.13a1 1 0 01.97-1.265h1.18a1 1 0 00.97-.71l.34-1.13a1 1 0 011.475-.555l.99.66a1 1 0 001.32-.083l.835-.835zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">All four values are written atomically when you save.</p>
          </div>
        </div>
        <div className="p-6">
          <TdsSettingsForm initial={settings} />
        </div>
      </div>

      {/* ── Closing card — how each setting flows ──────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              How each setting flows
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">From settings to disbursement</h3>
            <p className="mt-1.5 text-sm text-white/75">
              These four values feed every TDS calculation across the platform. The disbursement
              engine reads them at each vendor wallet payout; the TDS report uses them to compute
              its summary. Section 194C: ₹30,000 single payment / ₹1,00,000 aggregate FY is the
              standard reference floor.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <FlowItem
                title="Default rate"
                description="Applied when the TDS report or a disbursement does not specify a per-vendor override."
              />
              <FlowItem
                title="Threshold"
                description="Per-vendor cumulative floor. No TDS withheld below this line."
              />
              <FlowItem
                title="Section code"
                description="Appears on TDS certificates and the GSTN export — keep it accurate."
              />
              <FlowItem
                title="FY start"
                description="Resets cumulative thresholds when the new financial year begins."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  accent,
  dot,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  accent: "emerald" | "teal" | "cyan" | "slate";
  dot?: boolean;
}) {
  const palette: Record<string, { ring: string; text: string; bg: string; pip: string }> = {
    emerald: { ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white", pip: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" },
    teal: { ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white", pip: "bg-teal-500" },
    cyan: { ring: "ring-cyan-200", text: "text-cyan-700", bg: "from-cyan-50/60 to-white", pip: "bg-cyan-500" },
    slate: { ring: "ring-slate-200", text: "text-slate-700", bg: "from-slate-50 to-white", pip: "bg-slate-400" },
  };
  const p = palette[accent];
  return (
    <div className={`bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight tabular-nums ${p.text}`}>{value}</span>
        {dot && <span className={`w-2 h-2 rounded-full ${p.pip}`} />}
      </div>
      {suffix && <div className="mt-1 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}

function FlowItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm p-3.5">
      <div className="text-sm font-semibold tracking-wide">{title}</div>
      <p className="mt-1.5 text-[11px] text-white/70 leading-relaxed">{description}</p>
    </div>
  );
}
