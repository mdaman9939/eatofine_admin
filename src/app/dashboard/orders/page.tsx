import Link from "next/link";
import { adminFetch } from "../../../lib/api";

interface OrdersResponse {
  total: number;
  limit: number;
  offset: number;
  orders: Array<{
    id: number;
    user: { f_name: string | null; l_name: string | null; email: string | null; phone: string | null } | null;
    restaurant: { name: string | null } | null;
    order_amount: number;
    payment_status: string;
    order_status: string;
    payment_method: string | null;
    order_type: string;
    created_at: string | null;
  }>;
}

const FILTERS = [
  "",
  "scheduled",
  "pending",
  "confirmed",
  "accepted",
  "processing",
  "handover",
  "picked_up",
  "delivered",
  "canceled",
  "refunded",
  "offline_payment",
  "payment_failed",
];

const STATUS_PILL: Record<string, { tone: string; dot: string; label: string }> = {
  pending:    { tone: "bg-amber-50 text-amber-700 border-amber-200",      dot: "bg-amber-500",     label: "Pending" },
  confirmed:  { tone: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-500",      label: "Confirmed" },
  accepted:   { tone: "bg-sky-50 text-sky-700 border-sky-200",            dot: "bg-sky-500",       label: "Accepted" },
  processing: { tone: "bg-indigo-50 text-indigo-700 border-indigo-200",   dot: "bg-indigo-500",    label: "Processing" },
  handover:   { tone: "bg-violet-50 text-violet-700 border-violet-200",   dot: "bg-violet-500",    label: "Handover" },
  picked_up:  { tone: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", dot: "bg-fuchsia-500",   label: "Picked up" },
  delivered:  { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]", label: "Delivered" },
  canceled:   { tone: "bg-rose-50 text-rose-700 border-rose-200",         dot: "bg-rose-500",      label: "Canceled" },
  failed:     { tone: "bg-rose-50 text-rose-700 border-rose-200",         dot: "bg-rose-500",      label: "Failed" },
  scheduled:  { tone: "bg-purple-50 text-purple-700 border-purple-200",   dot: "bg-purple-500",    label: "Scheduled" },
  refunded:   { tone: "bg-orange-50 text-orange-700 border-orange-200",   dot: "bg-orange-500",    label: "Refunded" },
  offline_payment: { tone: "bg-slate-100 text-slate-700 border-slate-300", dot: "bg-slate-500",    label: "Offline pay" },
  payment_failed:  { tone: "bg-rose-50 text-rose-700 border-rose-200",   dot: "bg-rose-500",       label: "Payment failed" },
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const path = `/admin/orders?limit=100${status ? `&status=${status}` : ""}`;
  const data = await adminFetch<OrdersResponse>(path);

  // Compute summary buckets across the rendered set.
  const delivered = data.orders.filter((o) => o.order_status === "delivered").length;
  const canceled = data.orders.filter((o) => o.order_status === "canceled").length;
  const inFlight = data.orders.filter((o) => !["delivered", "canceled", "pending"].includes(o.order_status)).length;
  const pending = data.orders.filter((o) => o.order_status === "pending").length;
  const grossRevenue = data.orders
    .filter((o) => o.order_status === "delivered")
    .reduce((a, o) => a + o.order_amount, 0);

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
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Orders</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Live look at every order flowing through the platform. Filter by status, click any
              order ID for the full detail view with customer, restaurant, items, timeline, and
              status-advance actions.
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold">Showing</div>
            <div className="text-3xl font-bold tracking-tight tabular-nums">{data.orders.length}</div>
            <div className="text-xs text-white/65">of {data.total} total orders</div>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Delivered" value={delivered} suffix={`₹${grossRevenue.toLocaleString("en-IN")} gross`} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="In-flight" value={inFlight} suffix="being prepared / delivered" accent="cyan" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 18a3 3 0 100-6 3 3 0 000 6zm14 0a3 3 0 100-6 3 3 0 000 6zm-9-3l3-9h5m-5 9l-3-9H6" />
          </svg>
        } />
        <StatCard label="Pending" value={pending} suffix="awaiting acceptance" accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Canceled" value={canceled} suffix="across all filters" accent="rose" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
      </div>

      {/* ── Filter chips ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mr-2">Filter</span>
        {FILTERS.map((f) => {
          const isActive = status === f;
          const cfg = f ? STATUS_PILL[f] : null;
          return (
            <Link
              key={f || "all"}
              href={f ? `/dashboard/orders?status=${f}` : "/dashboard/orders"}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm shadow-emerald-500/25"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              {cfg && !isActive && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
              {f ? (cfg?.label ?? f) : "All"}
            </Link>
          );
        })}
      </div>

      {/* ── Orders table ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Order list</h2>
            <p className="text-xs text-slate-500 mt-0.5">Newest first. Click any order # for the full detail view.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {data.orders.length} {data.orders.length === 1 ? "row" : "rows"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Restaurant</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.orders.map((o) => {
                const customerName = o.user
                  ? `${o.user.f_name ?? ""} ${o.user.l_name ?? ""}`.trim() || o.user.email || o.user.phone || "—"
                  : "—";
                const paid = o.payment_status === "paid";
                return (
                  <tr key={o.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className="inline-flex items-center gap-1 font-mono text-sm text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                      >
                        #{o.id}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {initials(customerName)}
                        </span>
                        <span className="text-slate-700 text-sm truncate">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{o.restaurant?.name ?? <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">₹{o.order_amount.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <StatusPill status={o.order_status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <PaymentChip method={o.payment_method} />
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${paid ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>
                          <span className={`w-1 h-1 rounded-full ${paid ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {paid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {o.created_at ? (
                        <div>
                          <div>{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                          <div className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
              {data.orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium">No orders match this filter</p>
                      <p className="text-xs">Try clearing the filter or check back when more orders come in.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

function PaymentChip({ method }: { method: string | null }) {
  if (!method) return <span className="text-slate-300">—</span>;
  const labelMap: Record<string, { label: string; icon: React.ReactNode; tone: string }> = {
    cash_on_delivery: {
      label: "COD",
      tone: "bg-amber-50 text-amber-700 ring-amber-200",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
    digital_payment: {
      label: "Digital",
      tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      ),
    },
  };
  const cfg = labelMap[method] ?? { label: method, tone: "bg-slate-100 text-slate-700 ring-slate-200", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ${cfg.tone}`}>
      {cfg.icon}
      {cfg.label}
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
  accent: "emerald" | "cyan" | "amber" | "rose";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    cyan: { tile: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-700", bg: "from-cyan-50/60 to-white" },
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white" },
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
