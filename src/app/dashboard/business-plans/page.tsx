import { adminFetch } from "../../../lib/api";
import { ActionButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";
import { SlabRangeAxis } from "../../../components/SlabRangeAxis";
import { SlabCalculator } from "../../../components/SlabCalculator";
import { SlabEditButton } from "../../../components/SlabEditButton";

interface Slab {
  id: number;
  vendor_id: number | null;
  min_order_value: number;
  max_order_value: number;
  fixed_charge: number;
  extra_charge: number;
  gst_rate: number;
  gst_on_extra: boolean;
  effective_from: string | null;
  created_at: string | null;
  status: boolean;
}

/** Show a money amount without trailing zeros — whole numbers stay clean
 *  (₹500, not ₹500.00) while fractional amounts keep their decimals
 *  (₹102.45 stays ₹102.45). Avoids losing precision when the admin enters
 *  a slab boundary like 102.45 / 452.45. */
function money(n: number): string {
  if (!Number.isFinite(n)) return "0";
  // %1 === 0 → integer. Use 0 decimals; otherwise up to 2 decimals.
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
}

export default async function BusinessPlansPage() {
  const slabs = await adminFetch<Slab[]>("/admin/business-plans/slabs");

  // MongoDB returns null for absent numeric fields. Coerce everything to a
  // safe number so `.toFixed()` / arithmetic don't blow up downstream.
  for (const s of slabs) {
    s.min_order_value = Number(s.min_order_value ?? 0);
    s.max_order_value = Number(s.max_order_value ?? 0);
    s.fixed_charge = Number(s.fixed_charge ?? 0);
    s.extra_charge = Number(s.extra_charge ?? 0);
    s.gst_rate = Number(s.gst_rate ?? 0);
  }

  const activeSlabs = slabs.filter((s) => s.status).length;
  const avgFixed = slabs.length ? slabs.reduce((a, s) => a + s.fixed_charge, 0) / slabs.length : 0;
  const avgGst = slabs.length ? slabs.reduce((a, s) => a + s.gst_rate, 0) / slabs.length : 0;
  const widestRange = slabs.length
    ? slabs.reduce((m, s) => Math.max(m, s.max_order_value), 0)
    : 0;

  // For the per-row mini bar visualisation.
  const globalMax = widestRange || 1;
  const sorted = [...slabs].sort((a, b) => a.min_order_value - b.min_order_value);

  return (
    <div className="relative p-8 space-y-6">
      {/* Subtle page-level pattern so the white content sits on a more premium ground */}
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
              BRD §5.1 · Enhancements
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Slab-Based Business Plans</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Per-order deduction model. Configure charge slabs by order value range — each slab has a
              fixed charge, optional extra charge, and GST applied to either the fixed portion or
              fixed + extra.
            </p>
          </div>
          <CreateForm
            path="/business-plans/slabs"
            title="New slab"
            fields={[
              { name: "min_order_value", label: "Min order ₹", type: "number", required: true },
              { name: "max_order_value", label: "Max order ₹", type: "number", required: true },
              { name: "fixed_charge", label: "Fixed charge ₹", type: "number", required: true },
              { name: "extra_charge", label: "Extra charge ₹", type: "number", defaultValue: 0 },
              { name: "gst_rate", label: "GST %", type: "number", defaultValue: 18 },
              { name: "gst_on_extra", label: "GST on Fixed+Extra (else only Fixed)", type: "checkbox" },
            ]}
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total slabs" value={slabs.length} accent="blue" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        } />
        <StatCard label="Active" value={activeSlabs} suffix={`of ${slabs.length}`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Widest range" value={`₹${widestRange.toLocaleString("en-IN")}`} suffix="max cap" accent="indigo" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h18m-9-9v18" />
          </svg>
        } />
        <StatCard label="Avg GST" value={`${avgGst.toFixed(1)}%`} suffix={`avg fixed ₹${avgFixed.toFixed(0)}`} accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-6 4h4m2 5l4-4M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2h-2" />
          </svg>
        } />
      </div>

      {/* ── Coverage map (range diagram + gap warnings) ────────── */}
      <SlabRangeAxis slabs={slabs} />

      {/* ── Live calculator ────────────────────────────────────── */}
      <SlabCalculator />

      {/* ── Slabs table ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Charge slabs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sorted by order-value range. Each slab applies to one specific window.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {slabs.length} {slabs.length === 1 ? "row" : "rows"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold w-[28%]">Range</th>
                <th className="px-4 py-3 font-semibold text-right">Fixed</th>
                <th className="px-4 py-3 font-semibold text-right">Extra %</th>
                <th className="px-4 py-3 font-semibold text-right">GST</th>
                <th className="px-4 py-3 font-semibold">GST basis</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((s) => (
                <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors align-top">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-slate-400">#{s.id}</div>
                    {/* Show effective date if explicitly set, otherwise fall
                        back to created_at so every row has a "From …" label
                        for visual consistency. */}
                    {(s.effective_from || s.created_at) && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        From {new Date(s.effective_from ?? s.created_at!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-700 text-sm">
                      <span className="font-semibold">₹{money(s.min_order_value)}</span>
                      <span className="text-slate-400">–</span>
                      <span className="font-semibold">₹{money(s.max_order_value)}</span>
                    </div>
                    <MiniRangeBar min={s.min_order_value} max={s.max_order_value} globalMax={globalMax} active={s.status} />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900">₹{s.fixed_charge.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-slate-700">
                    {s.extra_charge > 0 && s.max_order_value > 0 ? (
                      <div>
                        <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-md px-2 py-0.5">
                          {((s.extra_charge / s.max_order_value) * 100).toFixed(2)}%
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">₹{s.extra_charge.toFixed(2)}</div>
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-md px-2 py-0.5">
                      {s.gst_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <GstBasisChip onExtra={s.gst_on_extra} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill active={s.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex gap-2">
                      <SlabEditButton
                        slab={{
                          id: s.id,
                          min_order_value: s.min_order_value,
                          max_order_value: s.max_order_value,
                          fixed_charge: s.fixed_charge,
                          extra_charge: s.extra_charge,
                          gst_rate: s.gst_rate,
                          gst_on_extra: !!s.gst_on_extra,
                        }}
                      />
                      <ActionButton
                        path={`/business-plans/slabs/${s.id}/status`}
                        method="PATCH"
                        body={{ status: !s.status }}
                        label={s.status ? "Disable" : "Enable"}
                        variant={s.status ? "subtle" : "primary"}
                      />
                      <DeleteButton basePath="/business-plans/slabs" id={s.id} />
                    </span>
                  </td>
                </tr>
              ))}
              {slabs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium">No slabs configured yet</p>
                      <p className="text-xs">Click &quot;+ New slab&quot; above to add your first charge slab.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Calculation logic (brand gradient closing card) ────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 7h6m-6 4h6m-6 4h4m2 5l4-4M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              BRD §5.1.1 · Calculation logic
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">How each slab applies to an order</h3>
            <p className="mt-1.5 text-sm text-white/75">
              The matched slab&apos;s fixed and (optional) extra charges are summed, GST is added on
              the configured basis, and the resulting deduction is taken off the order value to give
              the vendor net payout.
            </p>
            <pre className="mt-4 text-xs leading-relaxed text-white/95 font-mono bg-black/25 rounded-xl p-4 ring-1 ring-white/10 overflow-x-auto">
{`Base Charge       = Fixed Charge + Extra Charge
GST Amount        = (GST Basis) × (GST Rate / 100)
Total Deduction   = Base Charge + GST Amount
Vendor Net Payout = Order Value − Total Deduction`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniRangeBar({ min, max, globalMax, active }: { min: number; max: number; globalMax: number; active: boolean }) {
  const leftPct = (min / globalMax) * 100;
  const widthPct = ((max - min) / globalMax) * 100;
  return (
    <div className="mt-2 relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
      <div
        className={`absolute top-0 bottom-0 rounded-full ${active ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-slate-300"}`}
        style={{ left: `${leftPct}%`, width: `${Math.max(0.5, widthPct)}%` }}
      />
    </div>
  );
}

function GstBasisChip({ onExtra }: { onExtra: boolean }) {
  if (onExtra) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
        <span className="inline-flex gap-0.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
        </span>
        Fixed + Extra
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700">
      <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
      Fixed only
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
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
  accent: "blue" | "emerald" | "indigo" | "amber";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    blue: { tile: "bg-blue-100", ring: "ring-blue-200", text: "text-blue-700", bg: "from-blue-50/60 to-white" },
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    indigo: { tile: "bg-indigo-100", ring: "ring-indigo-200", text: "text-indigo-700", bg: "from-indigo-50/60 to-white" },
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white" },
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
