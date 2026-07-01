import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { CreateForm } from "../../../components/CreateForm";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface Reason {
  id: number;
  reason: string;
  user_type: string;
  status: boolean;
  is_default: boolean;
  scenario_key?: string | null;
}

/** Fault-attribution scenarios a cancel reason can be mapped to. Used by the
 *  refund engine: a restaurant-reject reason with one of these set overrides the
 *  stage-based default and decides whose wallet the penalty hits. "" = auto. */
const SCENARIO_OPTIONS = [
  { value: "", label: "— Auto (decide by stage) —" },
  { value: "RESTAURANT_REJECT_AFTER_ACCEPT_NO_DM", label: "Restaurant reject — after accept, no rider (restaurant penalty)" },
  { value: "RESTAURANT_REJECT_AFTER_ACCEPT_WITH_DM", label: "Restaurant reject — rider assigned (restaurant penalty + rider paid)" },
  { value: "RESTAURANT_REJECT_BEFORE_ACCEPT", label: "Restaurant reject — before accept (no penalty)" },
  { value: "ADMIN_WRONG_ITEM_RESTAURANT", label: "Wrong / missing item (restaurant pays)" },
  { value: "ADMIN_MISSING_PACKET_DM", label: "Missing packets (deliveryman pays)" },
  { value: "ADMIN_RESTAURANT_FAULT_AFTER_DELIVERY", label: "Restaurant fault after delivery" },
  { value: "ADMIN_RESTAURANT_FAULT_BEFORE_DELIVERY", label: "Restaurant fault before delivery" },
  { value: "ADMIN_DM_FAULT_AFTER_DELIVERY", label: "Deliveryman fault after delivery" },
  { value: "ADMIN_DM_FAULT_BEFORE_DELIVERY", label: "Deliveryman fault before delivery" },
];

function scenarioLabel(key?: string | null): string {
  if (!key) return "Auto (by stage)";
  return SCENARIO_OPTIONS.find((o) => o.value === key)?.label ?? key;
}

const USER_TYPE_CHIP: Record<string, { tone: string; icon: React.ReactNode; label: string }> = {
  customer: {
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    label: "Customer",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  restaurant: {
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
    label: "Restaurant",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7l9-4 9 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9" />
      </svg>
    ),
  },
  deliveryman: {
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    label: "Delivery man",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 18a3 3 0 100-6 3 3 0 000 6zm14 0a3 3 0 100-6 3 3 0 000 6zm-9-3l3-9h5m-5 9l-3-9H6" />
      </svg>
    ),
  },
  admin: {
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    label: "Admin",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export default async function OrderCancelReasonsPage() {
  const data = await adminFetch<{ reasons: Reason[] }>("/admin/order-cancel-reasons");
  const reasons = data.reasons;

  const customerCount = reasons.filter((r) => r.user_type === "customer").length;
  const restaurantCount = reasons.filter((r) => r.user_type === "restaurant").length;
  const dmCount = reasons.filter((r) => r.user_type === "deliveryman").length;
  const activeCount = reasons.filter((r) => r.status).length;

  // Sort by user_type then id desc for a stable, grouped view.
  const order: Record<string, number> = { customer: 0, restaurant: 1, deliveryman: 2, admin: 3 };
  const sorted = [...reasons].sort((a, b) => {
    const oa = order[a.user_type] ?? 99;
    const ob = order[b.user_type] ?? 99;
    if (oa !== ob) return oa - ob;
    return b.id - a.id;
  });

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
              Order management · Configuration
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Cancellation reasons</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              The dropdown options shown to customers, restaurants, and delivery partners when they
              cancel an order. Each reason maps to one user type — keep the list short and specific
              so analytics stay meaningful.
            </p>
          </div>
          <CreateForm
            path="/order-cancel-reasons"
            title="New cancel reason"
            fields={[
              { name: "reason", label: "Reason", required: true, placeholder: "Changed my mind" },
              {
                name: "user_type",
                label: "Applies to",
                type: "select",
                required: true,
                options: [
                  { value: "customer", label: "Customer" },
                  { value: "restaurant", label: "Restaurant" },
                  { value: "deliveryman", label: "Delivery man" },
                  { value: "admin", label: "Admin" },
                ],
              },
              {
                name: "scenario_key",
                label: "Fault mapping (penalty)",
                type: "select",
                options: SCENARIO_OPTIONS,
              },
            ]}
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total reasons" value={reasons.length} suffix={`${activeCount} active`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        } />
        <StatCard label="Customer" value={customerCount} suffix="user-facing options" accent="teal" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        } />
        <StatCard label="Restaurant" value={restaurantCount} suffix="vendor-facing options" accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7l9-4 9 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9" />
          </svg>
        } />
        <StatCard label="Delivery man" value={dmCount} suffix="DM-facing options" accent="cyan" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 18a3 3 0 100-6 3 3 0 000 6zm14 0a3 3 0 100-6 3 3 0 000 6zm-9-3l3-9h5m-5 9l-3-9H6" />
          </svg>
        } />
      </div>

      {/* ── Reasons table ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Order cancel reasons</h2>
            <p className="text-xs text-slate-500 mt-0.5">Grouped by user type. These show up in cancel flows across the customer, vendor, and delivery apps.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {reasons.length} {reasons.length === 1 ? "reason" : "reasons"}
          </span>
        </div>
        <PaginatedTable
          searchable
          pageSize={15}
          colCount={6}
          searchTexts={sorted.map((r) => `#${r.id} ${r.reason} ${r.user_type} ${scenarioLabel(r.scenario_key)}`.toLowerCase())}
          empty="No cancellation reasons yet — add one with the “+ New cancel reason” button above."
          headerRow={
            <tr>
              <th className="px-6 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Applies to</th>
              <th className="px-4 py-3 font-semibold">Fault mapping</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          }
          bodyRows={sorted.map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-4">
                    <span className="text-slate-800 font-medium">{r.reason}</span>
                    {r.is_default && (
                      <span className="ml-2 text-[10px] uppercase font-bold tracking-wide text-blue-700 bg-blue-50 ring-1 ring-blue-200 px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <UserTypeChip type={r.user_type} />
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs ${r.scenario_key ? "text-rose-700 font-medium" : "text-slate-400"}`}>{scenarioLabel(r.scenario_key)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill active={r.status} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex gap-2">
                      <EditRecordButton basePath="/order-cancel-reasons" id={r.id} title="Edit reason" values={r as unknown as Record<string, unknown>} fields={[
                        { name: "reason", label: "Reason" },
                        { name: "user_type", label: "User type", type: "select", options: [{ value: "customer", label: "Customer" }, { value: "deliveryman", label: "Delivery man" }, { value: "restaurant", label: "Restaurant" }] },
                        { name: "scenario_key", label: "Fault mapping (penalty)", type: "select", options: SCENARIO_OPTIONS },
                      ]} />
                      <ToggleStatusButton basePath="/order-cancel-reasons" id={r.id} currentStatus={r.status} />
                      <DeleteButton basePath="/order-cancel-reasons" id={r.id} />
                    </span>
                  </td>
                </tr>
              ))}
        />
      </div>
    </div>
  );
}

function UserTypeChip({ type }: { type: string }) {
  const cfg = USER_TYPE_CHIP[type] ?? { tone: "bg-slate-100 text-slate-700 ring-slate-200", label: type, icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ring-1 ${cfg.tone}`}>
      {cfg.icon}
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

function StatCard({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: "emerald" | "teal" | "amber" | "cyan";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white" },
    cyan: { tile: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-700", bg: "from-cyan-50/60 to-white" },
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
