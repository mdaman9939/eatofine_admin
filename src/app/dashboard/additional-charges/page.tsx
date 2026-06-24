import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";
import { GstOrderTypesPanel } from "../../../components/GstOrderTypesPanel";

interface Charge {
  id: number;
  charge_head: string;
  charge_type: "fixed" | "percentage";
  amount: number;
  gst_applicable: boolean;
  gst_rate: number;
  hsn_sac: string | null;
  description: string | null;
  status: boolean;
  order_types: string[];
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  take_away: "Take Away",
  dine_in: "Dine In",
  delivery: "Home Delivery",
};

const SAMPLE_ORDER_VALUE = 500;

// Shared palette for donut segments + legend swatches + breakdown row dots.
const PIE_COLORS = ["#10B981", "#14B8A6", "#22C55E", "#06B6D4", "#84CC16", "#0EA5E9"];

export default async function AdditionalChargesPage() {
  const [charges, gstSettings] = await Promise.all([
    adminFetch<Charge[]>("/admin/additional-charges"),
    adminFetch<{ settings: Array<{ key: string; value: string | null }> }>(
      "/admin/business-settings?prefix=food_gst_order_types",
    ).catch(() => ({ settings: [] as Array<{ key: string; value: string | null }> })),
    // Legacy toggle fetched only to derive the default when the new key is unset.
  ]);
  const togglesRes = await adminFetch<{ settings: Array<{ key: string; value: string | null }> }>(
    "/admin/business-settings?prefix=charges_on_takeaway_dinein",
  ).catch(() => ({ settings: [] as Array<{ key: string; value: string | null }> }));

  // Coerce numeric fields + order_types — MongoDB returns null for absent values.
  for (const c of charges) {
    c.amount = Number(c.amount ?? 0);
    c.gst_rate = Number(c.gst_rate ?? 0);
    c.order_types = Array.isArray(c.order_types) && c.order_types.length
      ? c.order_types
      : ["take_away", "dine_in", "delivery"];
  }

  // GST/extra-packaging order types: the new key wins; else default from the
  // legacy charges_on_takeaway_dinein toggle (ON → all three, OFF → delivery).
  const gstRaw = gstSettings.settings.find((s) => s.key === "food_gst_order_types")?.value ?? "";
  const toggleOn = /^(1|true|yes|on)$/i.test(
    (togglesRes.settings.find((s) => s.key === "charges_on_takeaway_dinein")?.value ?? "").trim(),
  );
  const gstInitial = gstRaw.trim()
    ? gstRaw.split(",").map((s) => s.trim()).filter((s) => ["take_away", "dine_in", "delivery"].includes(s))
    : (toggleOn ? ["take_away", "dine_in", "delivery"] : ["delivery"]);

  const active = charges.filter((c) => c.status);
  const activeCount = active.length;
  const totalFixed = active
    .filter((c) => c.charge_type === "fixed")
    .reduce((a, c) => a + c.amount, 0);
  const gstApplicableCount = active.filter((c) => c.gst_applicable).length;

  // Sample-order impact preview.
  const sampleImpact = active.map((c) => {
    const base =
      c.charge_type === "fixed" ? c.amount : +(SAMPLE_ORDER_VALUE * c.amount / 100).toFixed(2);
    const gst = c.gst_applicable ? +(base * c.gst_rate / 100).toFixed(2) : 0;
    return { id: c.id, name: c.charge_head, base, gst, total: +(base + gst).toFixed(2) };
  });
  const sampleSubtotal = sampleImpact.reduce((a, x) => a + x.base, 0);
  const sampleGst = sampleImpact.reduce((a, x) => a + x.gst, 0);
  const sampleTotal = sampleImpact.reduce((a, x) => a + x.total, 0);

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
              BRD §5.1.3 · Enhancements
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Additional User Charges</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Per-order user-payable charges over and above the food subtotal — packaging, platform
              fee, convenience fee, and similar. Each charge can be fixed (₹) or percentage (%), with
              independent GST applicability and HSN/SAC code for tax-invoice reporting.
            </p>
          </div>
          <CreateForm
            path="/additional-charges"
            title="New additional charge"
            fields={[
              { name: "charge_head", label: "Charge head", type: "text", required: true, placeholder: "Packaging Fee" },
              { name: "charge_type", label: "Type", type: "select", options: [{ value: "fixed", label: "Fixed ₹" }, { value: "percentage", label: "Percentage %" }], defaultValue: "fixed" },
              { name: "amount", label: "Amount", type: "number", required: true },
              { name: "gst_applicable", label: "GST applicable", type: "checkbox" },
              { name: "gst_rate", label: "GST %", type: "number", defaultValue: 18 },
              { name: "hsn_sac", label: "HSN / SAC code", type: "text", placeholder: "998599" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "ot_heading", label: "Applies to order types", type: "heading" },
              { name: "apply_take_away", label: "Take Away", type: "checkbox", defaultValue: true },
              { name: "apply_dine_in", label: "Dine In", type: "checkbox", defaultValue: true },
              { name: "apply_delivery", label: "Home Delivery", type: "checkbox", defaultValue: true },
            ]}
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total charges" value={charges.length} suffix={`${activeCount} active`} accent="blue" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        } />
        <StatCard label="Fixed total" value={`₹${totalFixed.toFixed(2)}`} suffix="added to every order" accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="GST applicable" value={gstApplicableCount} suffix={`of ${activeCount} active`} accent="indigo" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Sample impact" value={`₹${sampleTotal.toFixed(2)}`} suffix={`on a ₹${SAMPLE_ORDER_VALUE} order`} accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        } />
      </div>

      {/* ── GST / extra-packaging order-type scope (centralized) ── */}
      <GstOrderTypesPanel initial={gstInitial} />

      {/* ── Sample order impact preview ────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 ring-1 ring-amber-100 text-amber-700 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Sample order impact</h2>
              <p className="text-xs text-slate-500 mt-0.5">What an order of <span className="font-mono text-slate-700">₹{SAMPLE_ORDER_VALUE}</span> would see from these {activeCount} active charges.</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Total added</div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums">₹{sampleTotal.toFixed(2)}</div>
          </div>
        </div>
        <div className="p-6">
          {sampleImpact.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              No active charges — orders won&apos;t see any additional fees.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
              {/* Donut chart + legend */}
              <div className="flex flex-col items-center gap-3">
                <SampleDonut segments={sampleImpact.map((s, i) => ({ value: s.total, color: PIE_COLORS[i % PIE_COLORS.length], label: s.name }))} total={sampleTotal} />
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Composition</div>
                <div className="space-y-1 w-full max-w-[220px]">
                  {sampleImpact.map((s, i) => {
                    const sharePct = sampleTotal > 0 ? (s.total / sampleTotal) * 100 : 0;
                    return (
                      <div key={s.id} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-700 font-medium truncate">{s.name}</span>
                        <span className="ml-auto font-mono text-slate-700 font-semibold">{sharePct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Breakdown table */}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-3">Per-charge breakdown</div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100/70 text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Charge</th>
                        <th className="px-4 py-2 font-semibold text-right">Base</th>
                        <th className="px-4 py-2 font-semibold text-right">GST</th>
                        <th className="px-4 py-2 font-semibold text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sampleImpact.map((s, i) => (
                        <tr key={s.id} className="hover:bg-emerald-50/40 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-2 text-slate-700">
                              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              {s.name}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">₹{s.base.toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-xs text-slate-500">
                            {s.gst > 0 ? `+ ₹${s.gst.toFixed(2)}` : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900">₹{s.total.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td className="px-4 py-3 font-semibold text-slate-700">Subtotal</td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-700">₹{sampleSubtotal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs font-semibold text-slate-700">+ ₹{sampleGst.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700">₹{sampleTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Charges table ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">All charges</h2>
            <p className="text-xs text-slate-500 mt-0.5">Each active row applies to the order types ticked on it.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {charges.length} {charges.length === 1 ? "row" : "rows"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Charge head</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">GST</th>
                <th className="px-4 py-3 font-semibold">Order types</th>
                <th className="px-4 py-3 font-semibold">HSN / SAC</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {charges.map((c) => (
                <tr key={c.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{c.id}</td>
                  <td className="px-4 py-4 font-medium text-slate-800">{c.charge_head}</td>
                  <td className="px-4 py-4">
                    <TypeChip type={c.charge_type} />
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-slate-900 tabular-nums">
                    {c.charge_type === "fixed" ? `₹${c.amount.toFixed(2)}` : `${c.amount}%`}
                  </td>
                  <td className="px-4 py-4">
                    {c.gst_applicable ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        {c.gst_rate}% GST
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Exempt</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {c.order_types.length === 3 ? (
                      <span className="text-xs text-slate-400">All</span>
                    ) : c.order_types.length === 0 ? (
                      <span className="text-xs text-rose-400">None</span>
                    ) : (
                      <span className="inline-flex flex-wrap gap-1">
                        {c.order_types.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium ring-1 ring-slate-200">
                            {ORDER_TYPE_LABELS[t] ?? t}
                          </span>
                        ))}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-600">{c.hsn_sac ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-4 text-xs text-slate-600 max-w-xs truncate">{c.description ?? <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-4">
                    <StatusPill active={c.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex gap-2">
                      <Link href={`/dashboard/additional-charges/${c.id}/edit`} className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">Edit</Link>
                      <ToggleStatusButton basePath="/additional-charges" id={c.id} currentStatus={c.status} mode="base-path" />
                      <DeleteButton basePath="/additional-charges" id={c.id} />
                    </span>
                  </td>
                </tr>
              ))}
              {charges.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">No additional charges configured</p>
                      <p className="text-xs">Click &quot;+ New additional charge&quot; above to add your first one.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Closing logic card (brand gradient) ────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h.01M15 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              How these charges flow
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">From the customer&apos;s cart to the tax invoice</h3>
            <p className="mt-1.5 text-sm text-white/75">
              Every active charge in this list is appended to the customer&apos;s order total. Fixed
              charges add a flat amount; percentage charges apply against the food subtotal. When GST
              applicability is on, GST is computed per-charge and reflected separately on the tax
              invoice generated for that order (§5.2).
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FlowStep step="1" title="Food subtotal" body="Customer's items add up to a subtotal." />
              <FlowStep step="2" title="+ Additional charges" body="Each active charge above is appended (fixed or %)." />
              <FlowStep step="3" title="GST + grand total" body="Per-charge GST is summed; final total shown at checkout." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SampleDonut({ segments, total }: { segments: Array<{ value: number; color: string; label: string }>; total: number }) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const innerR = 44;
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

  const denom = total || 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={(r + innerR) / 2} fill="none" stroke="#F1F5F9" strokeWidth={r - innerR} />
      {segments.map((s, i) => {
        const startFrac = cumulative / denom;
        const endFrac = (cumulative + s.value) / denom;
        cumulative += s.value;
        return (
          <path
            key={i}
            d={arcPath(startFrac, endFrac)}
            fill={s.color}
            opacity={0.94}
            stroke="white"
            strokeWidth={2}
            className="transition-opacity hover:opacity-100"
          >
            <title>{s.label}: ₹{s.value.toFixed(2)} ({((s.value / denom) * 100).toFixed(1)}%)</title>
          </path>
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-500" fontSize="10" fontWeight="600" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Total
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-900" fontSize="20" fontWeight="700">
        ₹{total.toFixed(0)}
      </text>
    </svg>
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

function TypeChip({ type }: { type: "fixed" | "percentage" }) {
  if (type === "fixed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-md">
        <span className="font-mono">₹</span>
        Fixed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 bg-violet-50 ring-1 ring-violet-200 px-2 py-0.5 rounded-md">
      %
      <span>Percentage</span>
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
