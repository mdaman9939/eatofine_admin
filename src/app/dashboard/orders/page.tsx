import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "../../../lib/api";
import { OrderTypeConfigPanel } from "../../../components/OrderTypeConfigPanel";
import { ActionButton } from "../../../components/ActionButton";
import { PaginatedTable } from "../../../components/PaginatedTable";

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
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "";
  const orderType = sp.type ?? "";
  const path = `/admin/orders?limit=500${status ? `&status=${status}` : ""}${orderType ? `&order_type=${orderType}` : ""}`;

  let data: OrdersResponse;
  try {
    data = await adminFetch<OrdersResponse>(path);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    // Expired/revoked session → login. (In production the global error boundary
    // can't detect this because Next sanitizes server-error messages, so we
    // handle it here where the real reason is available.)
    if (reason === "not_authenticated" || reason.startsWith("api_error_401") || reason.startsWith("api_error_403")) {
      redirect("/login?reason=session_expired");
    }
    // Any other failure (backend cold start / 5xx / network) → a friendly,
    // retryable panel instead of crashing the whole route.
    return <OrdersLoadError reason={reason} />;
  }

  // Defensive: never let a missing field crash the whole page render.
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  const totalOrders = Number(data?.total ?? orders.length);

  // Compute summary buckets across the rendered set.
  const delivered = orders.filter((o) => o.order_status === "delivered").length;
  const canceled = orders.filter((o) => o.order_status === "canceled").length;
  const inFlight = orders.filter((o) => !["delivered", "canceled", "pending"].includes(o.order_status)).length;
  const pending = orders.filter((o) => o.order_status === "pending").length;
  const grossRevenue = orders
    .filter((o) => o.order_status === "delivered")
    .reduce((a, o) => a + Number(o.order_amount ?? 0), 0);

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
            <div className="text-3xl font-bold tracking-tight tabular-nums">{orders.length}</div>
            <div className="text-xs text-white/65">of {totalOrders} total orders</div>
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

      {/* ── Take Away / Dine In / Home Delivery configuration ───── */}
      <OrderTypeConfigPanel />

      {/* ── Filter chips ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold mr-2">Filter</span>
        {FILTERS.map((f) => {
          const isActive = status === f && !orderType;
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
        {/* Dine-in is an order TYPE (not a status) — its own chip. */}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <Link
          href="/dashboard/orders?type=dine_in"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            orderType === "dine_in"
              ? "bg-gradient-to-b from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-500/25"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
          }`}
        >
          {orderType !== "dine_in" && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
          Dine in
        </Link>
      </div>

      {/* ── Orders table ───────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Order list</h2>
          <p className="text-xs text-slate-500 mt-0.5">Newest first. Click any order # for the full detail view.</p>
        </div>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
          {orders.length} {orders.length === 1 ? "row" : "rows"}
        </span>
      </div>
      <PaginatedTable
        colCount={9}
        pageSize={10}
        searchable
        empty="No orders match this filter"
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">Order #</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Restaurant</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Payment</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        }
        searchTexts={orders.map((o) => {
          const customerName = o.user
            ? `${o.user.f_name ?? ""} ${o.user.l_name ?? ""}`.trim() || o.user.email || o.user.phone || ""
            : "";
          return `#${o.id} ${customerName} ${o.restaurant?.name ?? ""} ${o.order_status} ${o.payment_method ?? ""} ${o.payment_status}`.toLowerCase();
        })}
        bodyRows={orders.map((o) => {
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
                <Link
                  href={`/dashboard/invoices/${o.id}`}
                  className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-700"
                  title="View customer invoice"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Invoice
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
              <td className="px-4 py-4"><OrderTypeBadge type={o.order_type} /></td>
              <td className="px-4 py-4 text-right tabular-nums font-semibold text-slate-900">₹{Number(o.order_amount ?? 0).toFixed(2)}</td>
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
              <td className="px-4 py-4 text-right">
                {/* Admin authority — cancel any order directly from the list. */}
                {o.order_status === "canceled" || o.order_status === "refunded" ? (
                  <span className="text-[11px] text-slate-300">—</span>
                ) : (
                  <ActionButton
                    path={`/orders/${o.id}/status`}
                    method="PATCH"
                    body={{ status: "canceled", reason: "Cancelled by admin" }}
                    label="Cancel"
                    variant="danger"
                    confirm={`Cancel order #${o.id}? This is an admin override.`}
                  />
                )}
              </td>
            </tr>
          );
        })}
      />
    </div>
  );
}

/** Inline, retryable failure panel — shown when the orders feed can't be
 *  loaded (backend cold start / 5xx / network). Keeps the route alive and shows
 *  the real reason (this server-rendered string is NOT sanitized like the
 *  global error boundary), so issues are diagnosable instead of cryptic. */
function OrdersLoadError({ reason }: { reason: string }) {
  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 ring-1 ring-amber-200 text-amber-600 flex items-center justify-center mb-4">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-slate-900">Couldn&apos;t load orders</h1>
        <p className="mt-2 text-sm text-slate-600">
          The orders service didn&apos;t respond. The backend may be waking up from idle
          (free-tier cold start can take ~30–60s). Please retry in a moment.
        </p>
        <pre className="mt-4 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-auto whitespace-pre-wrap text-left">{reason}</pre>
        <div className="mt-5 flex gap-2 justify-center">
          <Link href="/dashboard/orders" className="rounded-md px-4 py-1.5 text-sm font-semibold bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-sm transition">
            Retry
          </Link>
          <Link href="/dashboard" className="rounded-md px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition">
            Back to dashboard
          </Link>
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

/** Order/delivery type badge — Dine In · Take Away · Home Delivery. */
function OrderTypeBadge({ type }: { type: string | null | undefined }) {
  const t = (type ?? "delivery").toLowerCase();
  const cfg: Record<string, { label: string; tone: string; icon: string }> = {
    dine_in: { label: "Dine In", tone: "bg-indigo-50 text-indigo-700 ring-indigo-200", icon: "🍽" },
    take_away: { label: "Take Away", tone: "bg-amber-50 text-amber-700 ring-amber-200", icon: "🛍" },
    delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200", icon: "🛵" },
    home_delivery: { label: "Home Delivery", tone: "bg-teal-50 text-teal-700 ring-teal-200", icon: "🛵" },
  };
  const c = cfg[t] ?? { label: type ?? "—", tone: "bg-slate-100 text-slate-600 ring-slate-200", icon: "" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${c.tone}`}>
      {c.icon && <span>{c.icon}</span>}{c.label}
    </span>
  );
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
