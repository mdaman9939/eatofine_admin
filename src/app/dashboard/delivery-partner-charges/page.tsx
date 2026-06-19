import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";
import { DmChargesCalculator } from "../../../components/DmChargesCalculator";
import { SituationalSurchargeEditor } from "../../../components/SituationalSurchargeEditor";
import { EditRecordButton } from "../../../components/EditRecordButton";

interface Slab {
  id: number;
  min_km: number;
  max_km: number;
  base_charge: number;
  extra_per_km: number;
  status: boolean;
  effective_from: string | null;
}

interface Surcharge {
  id: number;
  surcharge_type: "weekend" | "festival" | "late_night";
  label: string;
  config_json: unknown;
  surcharge_type_value: "fixed" | "percentage";
  amount: number;
  status: boolean;
}

const SLAB_COLORS = [
  "bg-gradient-to-b from-emerald-600 to-emerald-700",
  "bg-gradient-to-b from-teal-500 to-teal-600",
  "bg-gradient-to-b from-cyan-500 to-cyan-600",
  "bg-gradient-to-b from-sky-500 to-sky-600",
  "bg-gradient-to-b from-green-500 to-green-600",
  "bg-gradient-to-b from-lime-500 to-lime-600",
];

export default async function DeliveryPartnerChargesPage() {
  const [slabs, surcharges] = await Promise.all([
    adminFetch<Slab[]>("/admin/dm-charges/slabs"),
    adminFetch<Surcharge[]>("/admin/dm-charges/surcharges"),
  ]);

  // Coerce numeric fields — MongoDB returns null for absent values.
  for (const s of slabs) {
    s.min_km = Number(s.min_km ?? 0);
    s.max_km = Number(s.max_km ?? 0);
    s.base_charge = Number(s.base_charge ?? 0);
    s.extra_per_km = Number(s.extra_per_km ?? 0);
  }
  for (const sc of surcharges) {
    sc.amount = Number(sc.amount ?? 0);
  }

  const sortedSlabs = [...slabs].sort((a, b) => a.min_km - b.min_km);
  const activeSlabs = slabs.filter((s) => s.status);
  const minKm = activeSlabs.length ? Math.min(...activeSlabs.map((s) => s.min_km)) : 0;
  const maxKm = activeSlabs.length ? Math.max(...activeSlabs.map((s) => s.max_km)) : 0;
  const span = maxKm - minKm || 1;
  const pct = (v: number) => ((v - minKm) / span) * 100;

  const activeSurcharges = surcharges.filter((s) => s.status);
  const totalSurchargeFixed = activeSurcharges
    .filter((s) => s.surcharge_type_value === "fixed")
    .reduce((a, s) => a + s.amount, 0);

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
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery Partner Charges</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Distance-based payout to delivery partners, plus situational surcharges (weekend,
              festival, late-night). Per BRD §5.4 — these are internal-cost charges and{" "}
              <span className="font-semibold text-white">no GST</span> is applied on the DM-side total.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-white/95 ring-1 ring-white/30 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            GST-exempt (DM side)
          </span>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Distance slabs" value={slabs.length} suffix={`${activeSlabs.length} active`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h18m-9-9v18" />
          </svg>
        } />
        <StatCard label="Distance reach" value={activeSlabs.length ? `${maxKm} km` : "—"} suffix="max coverage" accent="teal" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        } />
        <StatCard label="Surcharges" value={surcharges.length} suffix={`${activeSurcharges.length} active`} accent="cyan" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Fixed surcharge total" value={`₹${totalSurchargeFixed.toFixed(0)}`} suffix="if all triggered together" accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        } />
      </div>

      {/* ── Coverage map ───────────────────────────────────────── */}
      {activeSlabs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Coverage map</h2>
            <p className="text-xs text-slate-500 mt-0.5">{activeSlabs.length} active slabs spanning {minKm}–{maxKm} km.</p>
          </div>
          <div className="px-6 py-6">
            <div className="relative h-10 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
              {sortedSlabs.filter((s) => s.status).map((s, i) => {
                const left = pct(s.min_km);
                const width = pct(s.max_km) - left;
                return (
                  <div
                    key={s.id}
                    className={`absolute top-0 bottom-0 ${SLAB_COLORS[i % SLAB_COLORS.length]} opacity-90`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`#${s.id} · ${s.min_km}–${s.max_km} km · base ₹${s.base_charge}`}
                  >
                    <div className="h-full flex items-center justify-center text-[10px] font-bold text-white/95 px-1 truncate">
                      #{s.id}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
              <span>{minKm} km</span>
              <span>{((minKm + maxKm) / 2).toFixed(1)} km</span>
              <span>{maxKm} km</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Distance slabs table ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Distance slabs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Sorted ascending. Each slab applies once and is matched by the live calculator.</p>
          </div>
          <CreateForm
            path="/dm-charges/slabs"
            title="New slab"
            fields={[
              { name: "min_km", label: "Min km", type: "number", required: true },
              { name: "max_km", label: "Max km", type: "number", required: true },
              { name: "base_charge", label: "Base charge ₹", type: "number", required: true },
              { name: "extra_per_km", label: "Long-trip reward ₹", type: "number", defaultValue: 0 },
            ]}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Range</th>
                <th className="px-4 py-3 font-semibold text-right">Base ₹</th>
                <th className="px-4 py-3 font-semibold text-right">Long-trip reward ₹</th>
                <th className="px-4 py-3 font-semibold">Effective from</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedSlabs.map((s, i) => (
                <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-[10px] font-bold ${SLAB_COLORS[i % SLAB_COLORS.length]}`}>
                      {s.id}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-800 text-sm">{s.min_km}–{s.max_km} km</div>
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900 tabular-nums">₹{s.base_charge.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right tabular-nums text-slate-700">
                    {s.extra_per_km > 0 ? `₹${s.extra_per_km.toFixed(2)}` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {s.effective_from ? new Date(s.effective_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill active={s.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex gap-2">
                      <EditRecordButton basePath="/dm-charges/slabs" id={s.id} title="Edit slab" values={s as unknown as Record<string, unknown>} fields={[
                        { name: "min_km", label: "Min km", type: "number" },
                        { name: "max_km", label: "Max km", type: "number" },
                        { name: "base_charge", label: "Base charge ₹", type: "number" },
                        { name: "extra_per_km", label: "Long-trip reward ₹", type: "number" },
                      ]} />
                      <ToggleStatusButton basePath="/dm-charges/slabs" id={s.id} currentStatus={s.status} mode="base-path" />
                      <DeleteButton basePath="/dm-charges/slabs" id={s.id} />
                    </span>
                  </td>
                </tr>
              ))}
              {slabs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12h18m-9-9v18" />
                      </svg>
                      <p className="text-sm font-medium">No distance slabs yet</p>
                      <p className="text-xs">Click &quot;+ New slab&quot; to define the first distance band.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Surcharges ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Situational surcharges</h2>
            <p className="text-xs text-slate-500 mt-0.5">Weekend / festival / late-night uplifts applied on top of the matched slab.</p>
          </div>
          <SituationalSurchargeEditor basePath="/dm-charges/surcharges" mode="create" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Label</th>
                <th className="px-4 py-3 font-semibold">Trigger</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surcharges.map((s) => (
                <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <TypeChip type={s.surcharge_type} />
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-800">{s.label}</td>
                  <td className="px-4 py-4 text-xs text-slate-600">
                    <SurchargeTrigger type={s.surcharge_type} config={s.config_json} />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900 tabular-nums">
                    {s.surcharge_type_value === "percentage" ? `${s.amount}%` : `₹${s.amount.toFixed(2)}`}
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill active={s.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex gap-2">
                      <SituationalSurchargeEditor basePath="/dm-charges/surcharges" surcharge={s as unknown as Parameters<typeof SituationalSurchargeEditor>[0]["surcharge"]} />
                      <ToggleStatusButton basePath="/dm-charges/surcharges" id={s.id} currentStatus={s.status} mode="base-path" />
                      <DeleteButton basePath="/dm-charges/surcharges" id={s.id} />
                    </span>
                  </td>
                </tr>
              ))}
              {surcharges.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No surcharges configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Live calculator ────────────────────────────────────── */}
      <DmChargesCalculator />

      {/* ── Closing card — formula ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 18a3 3 0 100-6 3 3 0 000 6zm14 0a3 3 0 100-6 3 3 0 000 6zm-9-3l3-9h5m-5 9l-3-9H6" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              BRD §5.4 · Computation logic
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">How a delivery partner&apos;s payout is built</h3>
            <p className="mt-1.5 text-sm text-white/75">
              The delivery&apos;s distance picks one slab. The slab&apos;s base plus its flat
              long-trip reward forms the trip pay — longer slabs carry a bigger reward. Active
              surcharges that match the current day/time/date stack on top. The final number is
              what the partner receives — no GST on this side per BRD.
            </p>
            <pre className="mt-4 text-xs leading-relaxed text-white/95 font-mono bg-black/25 rounded-xl p-4 ring-1 ring-white/10 overflow-x-auto">
{`Base trip pay = Base charge + Long-trip reward (flat, per matched slab)
Surcharges    = Σ active surcharges that match (day / time / date)
DM payable    = Base trip pay + Surcharges    // no GST applied`}
            </pre>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FlowStep step="1" title="Match slab" body="Find the distance slab covering the delivery distance." />
              <FlowStep step="2" title="Stack surcharges" body="Add any weekend / festival / late-night uplifts that apply." />
              <FlowStep step="3" title="Pay partner" body="Final DM-side amount, no GST. Settles to the DM wallet." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurchargeTrigger({ type, config }: { type: Surcharge["surcharge_type"]; config: unknown }) {
  const cfg = (config as Record<string, unknown>) ?? {};
  if (type === "weekend" && Array.isArray(cfg.days)) {
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return <span>{(cfg.days as number[]).map((d) => dayMap[d] ?? d).join(" · ")}</span>;
  }
  if (type === "late_night" && typeof cfg.start === "string" && typeof cfg.end === "string") {
    return <span>{cfg.start} → {cfg.end}</span>;
  }
  if (type === "festival" && Array.isArray(cfg.dates)) {
    const dates = cfg.dates as string[];
    return (
      <span className="inline-flex flex-wrap gap-1">
        {dates.slice(0, 3).map((d) => <code key={d} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{d}</code>)}
        {dates.length > 3 && <span className="text-[10px] text-slate-400">+{dates.length - 3} more</span>}
      </span>
    );
  }
  return <code className="text-[10px] text-slate-400">{JSON.stringify(config)}</code>;
}

function TypeChip({ type }: { type: Surcharge["surcharge_type"] }) {
  const map: Record<string, { tone: string; dot: string; label: string }> = {
    weekend: { tone: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", label: "Weekend" },
    festival: { tone: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", label: "Festival" },
    late_night: { tone: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500", label: "Late night" },
  };
  const cfg = map[type] ?? { tone: "bg-slate-50 text-slate-700 ring-slate-200", dot: "bg-slate-400", label: type };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ring-1 ${cfg.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
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
  accent: "emerald" | "teal" | "cyan" | "amber";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
    cyan: { tile: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-700", bg: "from-cyan-50/60 to-white" },
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
