import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { ActionButton } from "../../../components/ActionButton";
import { RefundSettingsPanel } from "../../../components/RefundSettingsPanel";

interface Refund {
  id: number;
  order_id: number;
  user_id: number;
  order_status: string;
  customer_reason: string | null;
  refund_amount: number;
  refund_status: string;
  refund_method: string;
  created_at: string | null;
}

const NEXT_STATES = ["approved", "rejected", "completed"];

const STATUS_PILL: Record<string, { tone: string; dot: string; label: string }> = {
  pending:   { tone: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]", label: "Pending" },
  approved:  { tone: "bg-blue-50 text-blue-700 border-blue-200",          dot: "bg-blue-500",       label: "Approved" },
  rejected:  { tone: "bg-rose-50 text-rose-700 border-rose-200",          dot: "bg-rose-500",       label: "Rejected" },
  completed: { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]", label: "Completed" },
};

const METHOD_PILL: Record<string, { tone: string; icon: React.ReactNode; label: string }> = {
  wallet: {
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    label: "Wallet",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m3 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H10a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  },
  original_payment_method: {
    tone: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    label: "Original",
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
      </svg>
    ),
  },
};

export default async function RefundsPage() {
  const data = await adminFetch<{ total: number; items: Refund[] }>("/admin/refunds?limit=100");
  const refunds = data.items;

  // Normalise all numeric fields — MongoDB returns null/string for some rows
  // where Prisma used to coerce Decimal → number. Guard every reducer/format.
  for (const r of refunds) {
    r.refund_amount = Number(r.refund_amount ?? 0);
  }

  const pendingCount = refunds.filter((r) => r.refund_status === "pending").length;
  const approvedCount = refunds.filter((r) => r.refund_status === "approved").length;
  const completedCount = refunds.filter((r) => r.refund_status === "completed").length;
  const rejectedCount = refunds.filter((r) => r.refund_status === "rejected").length;
  const totalRefunded = refunds
    .filter((r) => r.refund_status === "completed")
    .reduce((a, r) => a + r.refund_amount, 0);

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
              Order management
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Order refunds</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Customer-initiated refund requests with their current state in the approval lifecycle.
              Approve to authorize, reject to deny, or mark completed once the money has actually
              moved back to the customer.
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold">Showing</div>
            <div className="text-3xl font-bold tracking-tight tabular-nums">{refunds.length}</div>
            <div className="text-xs text-white/65">of {data.total} total requests</div>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending" value={pendingCount} suffix="awaiting decision" accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Approved" value={approvedCount} suffix="ready to disburse" accent="blue" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Completed" value={completedCount} suffix={`₹${totalRefunded.toLocaleString("en-IN")} refunded`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        } />
        <StatCard label="Rejected" value={rejectedCount} suffix="declined" accent="rose" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
      </div>

      {/* ── Refund configuration ───────────────────────────────── */}
      <RefundSettingsPanel />

      {/* ── Refunds table ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Refund requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pending requests at the top need a decision — use the action buttons on the right.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {refunds.length} {refunds.length === 1 ? "request" : "requests"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Method</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds.map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors align-top">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/dashboard/orders/${r.order_id}`}
                      className="inline-flex items-center font-mono text-sm text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                    >
                      #{r.order_id}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        U{r.user_id}
                      </span>
                      <span className="text-slate-700 text-sm font-mono">#{r.user_id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700 max-w-xs">
                    {r.customer_reason ? (
                      <span className="line-clamp-2">{r.customer_reason}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">
                    ₹{Number(r.refund_amount ?? 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <MethodPill method={r.refund_method} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={r.refund_status} />
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {r.created_at ? (
                      <div>
                        <div>{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                        <div className="text-[10px] text-slate-400">{new Date(r.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="inline-flex flex-wrap gap-1.5 justify-end">
                      <Link
                        href={`/dashboard/refunds/${r.id}`}
                        className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      >
                        View
                      </Link>
                      {NEXT_STATES.filter((s) => s !== r.refund_status).map((s) => (
                        <ActionButton
                          key={s}
                          path={`/refunds/${r.id}/status`}
                          method="PATCH"
                          body={{ status: s }}
                          label={transitionLabel(s)}
                          variant={transitionVariant(s)}
                        />
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
              {refunds.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h11a4 4 0 014 4v0a4 4 0 01-4 4h-3m-8-8l3-3m-3 3l3 3" />
                      </svg>
                      <p className="text-sm font-medium">No refund requests yet</p>
                      <p className="text-xs">Refund requests from customers will appear here once raised.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Closing card — refund lifecycle ────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 10h11a4 4 0 014 4v0a4 4 0 01-4 4h-3m-8-8l3-3m-3 3l3 3" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
              Refund lifecycle
            </div>
            <h3 className="mt-2 text-xl font-bold tracking-tight">From request to refunded</h3>
            <p className="mt-1.5 text-sm text-white/75">
              Customers initiate refund requests from their order screen. Admins move them through
              the lifecycle below. Rejected requests close immediately; approved ones progress to
              completed once the actual disbursement is confirmed.
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <LifecycleStep step="1" title="Pending" body="Customer raised a refund request awaiting admin decision." active={pendingCount > 0} />
              <LifecycleStep step="2a" title="Approved" body="Admin authorized the refund — disbursement queued." active={approvedCount > 0} />
              <LifecycleStep step="2b" title="Rejected" body="Admin denied the refund. Request closes." active={rejectedCount > 0} />
              <LifecycleStep step="3" title="Completed" body="Money confirmed back to the customer." active={completedCount > 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function transitionLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function transitionVariant(s: string): "primary" | "danger" | "subtle" {
  if (s === "rejected") return "danger";
  if (s === "completed") return "primary";
  return "subtle";
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[status] ?? { tone: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function MethodPill({ method }: { method: string }) {
  const cfg = METHOD_PILL[method] ?? {
    tone: "bg-slate-100 text-slate-700 ring-slate-200",
    label: method,
    icon: null as React.ReactNode,
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ring-1 ${cfg.tone}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function LifecycleStep({ step, title, body, active }: { step: string; title: string; body: string; active?: boolean }) {
  return (
    <div className={`rounded-xl ${active ? "bg-white/15 ring-1 ring-white/25" : "bg-white/5 ring-1 ring-white/10"} backdrop-blur-sm p-3.5`}>
      <div className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded-full ${active ? "bg-white text-emerald-700" : "bg-white/15 text-white"} text-[10px] font-bold flex items-center justify-center`}>
          {step}
        </span>
        <span className="text-sm font-semibold tracking-wide">{title}</span>
      </div>
      <p className="mt-2 text-[11px] text-white/70 leading-relaxed">{body}</p>
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
  value: number;
  suffix?: string;
  accent: "amber" | "blue" | "emerald" | "rose";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white" },
    blue: { tile: "bg-blue-100", ring: "ring-blue-200", text: "text-blue-700", bg: "from-blue-50/60 to-white" },
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    rose: { tile: "bg-rose-100", ring: "ring-rose-200", text: "text-rose-700", bg: "from-rose-50/60 to-white" },
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
