import Link from "next/link";
import { adminFetch } from "../../lib/api";

// Stable Indian-locale formatters. Node's ICU often lacks "en-IN" data, so
// using toLocaleString("en-IN") server-side produces different output than the
// browser, which causes React hydration mismatches. These helpers format
// identically on both sides.
function inrNumber(n: number, fractionDigits = 0): string {
  const negative = n < 0 ? "-" : "";
  const abs = Math.abs(n).toFixed(fractionDigits);
  const [whole, frac] = abs.split(".");
  if (whole.length <= 3) return negative + (frac ? `${whole}.${frac}` : whole);
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const restGrouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return negative + restGrouped + "," + last3 + (frac ? `.${frac}` : "");
}

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDayLabel(yyyyMmDd: string): string {
  const [, m, d] = yyyyMmDd.split("-").map(Number);
  return `${d} ${SHORT_MONTHS[(m ?? 1) - 1]}`;
}

interface DashboardStats {
  orders: {
    total: number; pending: number; delivered: number; canceled: number;
    refunded?: number; payment_failed?: number; processing?: number;
    picked_up?: number; scheduled?: number;
  };
  restaurants: { total: number; active: number };
  users: { total: number };
  delivery_men: { total: number };
  vendors: { total: number };
  food: { total: number };
  revenue: { total: number };
}

interface SalesPoint {
  day: string;
  revenue: number;
  orders: number;
  tax: number;
  delivery: number;
}

interface SalesSummary {
  days: number;
  total_revenue: number;
  total_orders: number;
  series: SalesPoint[];
}

export default async function DashboardPage() {
  const [stats, sales] = await Promise.all([
    adminFetch<DashboardStats>("/admin/dashboard/stats"),
    adminFetch<SalesSummary>("/admin/reports/sales-summary?days=14").catch(() => ({ days: 14, total_revenue: 0, total_orders: 0, series: [] as SalesPoint[] })),
  ]);

  const adminCut = +(stats.revenue.total * 0.1).toFixed(2);
  const vendorPayout = +(stats.revenue.total - adminCut).toFixed(2);

  // Other in-flight buckets for the secondary row.
  const inFlight = Math.max(0, stats.orders.total - stats.orders.delivered - stats.orders.canceled - stats.orders.pending);

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
              All Data · Demo Zone
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Welcome back, Super.</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              You&apos;re looking at consolidated data across all zones in demo mode. Set up your zones
              and complete a few orders to see live operational numbers reflected here.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard/zones"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 hover:bg-white text-emerald-700 text-sm font-semibold px-4 py-2 shadow-sm hover:shadow transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Create zone
              </Link>
              <Link
                href="/dashboard/reports"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-4 py-2 ring-1 ring-white/20 backdrop-blur-sm transition-all"
              >
                View reports
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/65 font-semibold">Gross revenue</div>
            <div className="text-3xl font-bold tracking-tight tabular-nums">₹{inrNumber(stats.revenue.total, 2)}</div>
            <div className="text-xs text-white/65">across {stats.orders.delivered} delivered orders</div>
          </div>
        </div>
      </div>

      {/* ── Order statistics ───────────────────────────────────── */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Order statistics</h2>
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
            Zone: All
          </span>
        </div>
        <span className="text-xs text-slate-500">Last 14 days</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PrimaryStatCard label="Delivered orders" value={stats.orders.delivered} accent="emerald" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 100-4 2 2 0 000 4zm0 0a2 2 0 002 2h10a2 2 0 002-2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        } />
        <PrimaryStatCard label="Canceled orders" value={stats.orders.canceled} accent="rose" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <PrimaryStatCard label="Refunded orders" value={stats.orders.refunded ?? 0} accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h11a4 4 0 014 4v0a4 4 0 01-4 4h-3m-8-8l3-3m-3 3l3 3" />
          </svg>
        } />
        <PrimaryStatCard label="Payment failed" value={stats.orders.payment_failed ?? 0} accent="orange" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
          </svg>
        } />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SecondaryStatCard label="Unassigned orders" value={stats.orders.pending} accent="teal" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        } />
        <SecondaryStatCard label="Accepted by DM" value={inFlight} accent="cyan" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 18a3 3 0 100-6 3 3 0 000 6zm14 0a3 3 0 100-6 3 3 0 000 6zm-9-3l3-9h5m-5 9l-3-9H6" />
          </svg>
        } />
        <SecondaryStatCard label="Cooking in kitchen" value={stats.orders.processing ?? 0} accent="amber" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17a9 9 0 0118 0M3 17h18M5 21h14" />
          </svg>
        } />
        <SecondaryStatCard label="Picked up by DM" value={stats.orders.picked_up ?? 0} accent="lime" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        } />
      </div>

      {/* ── Order composition + revenue chart side-by-side ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Donut: orders by status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Order composition</h2>
            <p className="text-xs text-slate-500 mt-0.5">Status split across {stats.orders.total} {stats.orders.total === 1 ? "order" : "orders"}.</p>
          </div>
          <div className="p-6 flex flex-col items-center gap-4">
            <OrderDonut
              delivered={stats.orders.delivered}
              canceled={stats.orders.canceled}
              pending={stats.orders.pending}
              inFlight={inFlight}
            />
            <div className="space-y-2 w-full">
              <DonutLegend label="Delivered" value={stats.orders.delivered} total={stats.orders.total} color="#10B981" />
              <DonutLegend label="In-flight" value={inFlight} total={stats.orders.total} color="#06B6D4" />
              <DonutLegend label="Pending" value={stats.orders.pending} total={stats.orders.total} color="#F59E0B" />
              <DonutLegend label="Canceled" value={stats.orders.canceled} total={stats.orders.total} color="#F43F5E" />
            </div>
          </div>
        </div>

        {/* Revenue chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Revenue trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daily gross revenue for the last {sales.days} days.</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700">Total sell: <strong className="ml-1">₹{inrNumber(stats.revenue.total)}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-slate-700">Admin cut: <strong className="ml-1">₹{inrNumber(adminCut)}</strong></span>
              </span>
            </div>
          </div>
          <div className="p-6">
            <RevenueChart series={sales.series} />
          </div>
        </div>
      </div>

      {/* ── Catalog KPIs ──────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Catalog at a glance</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile label="Restaurants" value={stats.restaurants.total} sub={`${stats.restaurants.active} active`} accent="emerald" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7l9-4 9 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9" />
            </svg>
          } />
          <KpiTile label="Customers" value={stats.users.total} sub="registered" accent="teal" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 014-4h1m4-3a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          } />
          <KpiTile label="Vendors" value={stats.vendors.total} sub="owner accounts" accent="cyan" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 4h14l-1 9H6L5 4zm0 0L4 2H2m3 11l-1 5h16l-1-5" />
            </svg>
          } />
          <KpiTile label="Food items" value={stats.food.total} sub="across menus" accent="amber" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 17a9 9 0 0118 0M3 17h18M5 21h14" />
            </svg>
          } />
        </div>
      </div>

      {/* ── Closing card — quick links ─────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(110,231,183,0.35),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/65 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/65" />
            Jump in
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight">Common admin tasks</h3>
          <p className="mt-1.5 text-sm text-white/75">Pick up where you left off — or set something new in motion.</p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickLink href="/dashboard/orders" title="Manage orders" body={`${stats.orders.pending} pending acceptance`} />
            <QuickLink href="/dashboard/restaurants" title="Restaurants" body={`${stats.restaurants.active} active locations`} />
            <QuickLink href="/dashboard/business-plans" title="Business plans" body="Configure charge slabs" />
            <QuickLink href="/dashboard/tds" title="TDS reports" body="Vendor disbursement view" />
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <PayoutSummary label="Vendor payout" value={vendorPayout} dotColor="bg-emerald-300" />
            <PayoutSummary label="Admin commission" value={adminCut} dotColor="bg-cyan-300" />
            <PayoutSummary label="Total invoiced" value={stats.revenue.total} dotColor="bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PayoutSummary({ label, value, dotColor }: { label: string; value: number; dotColor: string }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm p-3.5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/65 font-semibold">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {label}
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight tabular-nums">₹{inrNumber(value, 2)}</div>
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl bg-white/5 hover:bg-white/15 ring-1 ring-white/10 hover:ring-white/30 backdrop-blur-sm p-4 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          <div className="text-[11px] text-white/65 mt-0.5">{body}</div>
        </div>
        <svg className="w-4 h-4 text-white/55 group-hover:text-white group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function PrimaryStatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: "emerald" | "rose" | "amber" | "orange";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string; value: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white", value: "text-slate-900" },
    rose: { tile: "bg-rose-100", ring: "ring-rose-200", text: "text-rose-700", bg: "from-rose-50/60 to-white", value: "text-rose-700" },
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white", value: "text-slate-900" },
    orange: { tile: "bg-orange-100", ring: "ring-orange-200", text: "text-orange-700", bg: "from-orange-50/60 to-white", value: "text-slate-900" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-3xl font-bold tracking-tight tabular-nums ${p.value}`}>{value}</div>
          <div className="text-sm text-slate-600 mt-1">{label}</div>
        </div>
        <span className={`w-10 h-10 rounded-xl ${p.tile} ring-1 ${p.ring} ${p.text} flex items-center justify-center shadow-sm`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function SecondaryStatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: "teal" | "cyan" | "amber" | "lime";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
    cyan: { tile: "bg-cyan-100", ring: "ring-cyan-200", text: "text-cyan-700", bg: "from-cyan-50/60 to-white" },
    amber: { tile: "bg-amber-100", ring: "ring-amber-200", text: "text-amber-700", bg: "from-amber-50/60 to-white" },
    lime: { tile: "bg-lime-100", ring: "ring-lime-200", text: "text-lime-700", bg: "from-lime-50/60 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-4 flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-9 h-9 rounded-lg ${p.tile} ring-1 ${p.ring} ${p.text} flex items-center justify-center shrink-0`}>
          {icon}
        </span>
        <div className="text-sm font-medium text-slate-700 truncate">{label}</div>
      </div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: number | string;
  sub: string;
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
    <div className={`bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
        <span className={`w-10 h-10 rounded-xl ${p.tile} ring-1 ${p.ring} ${p.text} flex items-center justify-center shadow-sm`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}

function DonutLegend({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
        <span className="text-slate-700 truncate">{label}</span>
      </span>
      <span className="font-mono text-slate-600 text-xs">
        <span className="font-semibold text-slate-900">{value}</span>
        <span className="text-slate-400 ml-1.5">{pct.toFixed(0)}%</span>
      </span>
    </div>
  );
}

function OrderDonut({ delivered, canceled, pending, inFlight }: { delivered: number; canceled: number; pending: number; inFlight: number }) {
  const total = delivered + canceled + pending + inFlight;
  const segments = [
    { value: delivered, color: "#10B981" },
    { value: inFlight,  color: "#06B6D4" },
    { value: pending,   color: "#F59E0B" },
    { value: canceled,  color: "#F43F5E" },
  ];
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 86;
  const innerR = 54;
  let cumulative = 0;
  const denom = total || 1;

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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={(r + innerR) / 2} fill="none" stroke="#F1F5F9" strokeWidth={r - innerR} />
      {segments.map((s, i) => {
        if (s.value === 0) return null;
        const startFrac = cumulative / denom;
        const endFrac = (cumulative + s.value) / denom;
        cumulative += s.value;
        return (
          <path key={i} d={arcPath(startFrac, endFrac)} fill={s.color} opacity={0.95} stroke="white" strokeWidth={2} />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-500" fontSize="10" fontWeight="600" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Total orders
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="fill-slate-900" fontSize="24" fontWeight="700">
        {total}
      </text>
    </svg>
  );
}

function RevenueChart({ series }: { series: SalesPoint[] }) {
  if (series.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
        No revenue data yet — complete a few delivered orders to populate this chart.
      </div>
    );
  }

  const maxRev = Math.max(...series.map((s) => s.revenue), 1);
  const w = 700;
  const h = 200;
  const pad = { top: 16, right: 16, bottom: 28, left: 16 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  // Build smooth line path for revenue + area fill.
  const stepX = series.length > 1 ? innerW / (series.length - 1) : innerW;
  const points = series.map((s, i) => ({
    x: pad.left + i * stepX,
    y: pad.top + innerH - (s.revenue / maxRev) * innerH,
    rev: s.revenue,
    day: s.day,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pad.left + (series.length - 1) * stepX} ${pad.top + innerH} L ${pad.left} ${pad.top + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-48">
      <defs>
        <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((f, i) => (
        <line
          key={i}
          x1={pad.left}
          x2={pad.left + innerW}
          y1={pad.top + innerH * f}
          y2={pad.top + innerH * f}
          stroke="#E2E8F0"
          strokeDasharray="3,3"
        />
      ))}
      {/* Area + line */}
      <path d={areaPath} fill="url(#revArea)" />
      <path d={linePath} fill="none" stroke="#10B981" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#10B981" strokeWidth={2} />
          <title>{`${p.day}: ₹${inrNumber(p.rev)}`}</title>
        </g>
      ))}
      {/* X-axis labels (sparse) */}
      {points.map((p, i) => {
        const showLabel = i === 0 || i === points.length - 1 || (series.length > 6 ? i === Math.floor(points.length / 2) : true);
        if (!showLabel) return null;
        return (
          <text key={i} x={p.x} y={h - 8} textAnchor="middle" fontSize="10" className="fill-slate-500">
            {shortDayLabel(p.day)}
          </text>
        );
      })}
    </svg>
  );
}
