import { adminFetch } from "../../../lib/api";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";
import { VendorPromoActions } from "../../../components/VendorPromoActions";

type PromoStatus = "draft" | "pending" | "approved" | "rejected" | "live" | "paused" | "expired";
type PromoType = "discount" | "banner" | "campaign";
type DiscountType = "percentage" | "flat" | string;
type Audience = "all" | "new" | "repeat";

interface VendorPromo {
  id: number;
  vendor_id: number;
  vendor_name: string | null;
  restaurant_id: number;
  restaurant_name: string | null;
  title: string;
  description: string | null;
  promo_type: PromoType;
  discount_type: DiscountType | null;
  discount_value: number | null;
  min_order_value: number | null;
  max_discount: number | null;
  start_date: string | null;
  end_date: string | null;
  image_path: string | null;
  target_audience: Audience;
  status: PromoStatus;
  admin_remarks: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  total_uses: number | null;
  created_at: string | null;
}

interface PromoStats {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  live: number;
  paused: number;
  expired: number;
  total: number;
}

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  live: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  paused: "bg-slate-100 text-slate-600 border-slate-200",
  expired: "bg-slate-100 text-slate-600 border-slate-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
  approved: "bg-emerald-500",
  live: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]",
  rejected: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
  paused: "bg-slate-400",
  expired: "bg-slate-400",
  draft: "bg-slate-400",
};

const TYPE_CHIP: Record<PromoType, string> = {
  discount: "bg-emerald-50 text-emerald-700 border-emerald-200",
  banner: "bg-teal-50 text-teal-700 border-teal-200",
  campaign: "bg-amber-50 text-amber-700 border-amber-200",
};

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "All customers",
  new: "New customers",
  repeat: "Repeat customers",
};

const AUDIENCE_CHIP: Record<Audience, string> = {
  all: "bg-slate-50 text-slate-700 border-slate-200",
  new: "bg-sky-50 text-sky-700 border-sky-200",
  repeat: "bg-violet-50 text-violet-700 border-violet-200",
};

function formatDiscount(type: DiscountType | null, value: number | null): string {
  if (value === null || value === undefined) return "—";
  return type === "percentage" ? `${value}%` : `₹${value}`;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
}

export default async function VendorPromotionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? "";
  const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";

  const [promos, stats] = await Promise.all([
    adminFetch<VendorPromo[]>(`/admin/vendor-promotions${qs}`),
    adminFetch<PromoStats>("/admin/vendor-promotions/stats"),
  ]);

  const slices = [
    { label: "Pending", value: stats.pending, color: DONUT_PALETTE.amber },
    { label: "Live", value: stats.live, color: DONUT_PALETTE.emerald },
    { label: "Approved", value: stats.approved, color: DONUT_PALETTE.teal },
    { label: "Rejected", value: stats.rejected, color: DONUT_PALETTE.rose },
    { label: "Paused", value: stats.paused, color: DONUT_PALETTE.slate },
    { label: "Expired", value: stats.expired, color: DONUT_PALETTE.slate },
  ].filter((s) => s.value > 0);

  const headerRow = (
    <tr>
      <th className="px-4 py-3 font-semibold w-16">#</th>
      <th className="px-4 py-3 font-semibold">Promotion</th>
      <th className="px-4 py-3 font-semibold">Vendor</th>
      <th className="px-4 py-3 font-semibold">Type</th>
      <th className="px-4 py-3 font-semibold">Discount</th>
      <th className="px-4 py-3 font-semibold">Audience</th>
      <th className="px-4 py-3 font-semibold">Validity</th>
      <th className="px-4 py-3 font-semibold text-right">Uses</th>
      <th className="px-4 py-3 font-semibold">Status</th>
      <th className="px-4 py-3 font-semibold text-right">Actions</th>
    </tr>
  );

  const bodyRows = promos.map((p) => {
    const typeChip = TYPE_CHIP[p.promo_type] ?? "bg-slate-50 text-slate-700 border-slate-200";
    const statusChip = STATUS_CHIP[p.status] ?? STATUS_CHIP.draft;
    const statusDot = STATUS_DOT[p.status] ?? STATUS_DOT.draft;
    const audienceChip = AUDIENCE_CHIP[p.target_audience] ?? AUDIENCE_CHIP.all;
    const audienceLabel = AUDIENCE_LABEL[p.target_audience] ?? p.target_audience;

    return (
      <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
        <td className="px-4 py-3 font-mono text-xs text-slate-400 w-16">#{p.id}</td>
        <td className="px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-slate-900 truncate max-w-[260px]">{p.title}</div>
              {p.description && (
                <div className="text-[11px] text-slate-500 truncate max-w-[260px] mt-0.5">{p.description}</div>
              )}
              {p.admin_remarks && p.status !== "pending" && (
                <div className="text-[11px] text-slate-500 italic truncate max-w-[260px] mt-0.5">&ldquo;{p.admin_remarks}&rdquo;</div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">
            {p.vendor_name ?? `#${p.vendor_id}`}
          </div>
          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
            {p.restaurant_name ?? `Restaurant #${p.restaurant_id}`}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${typeChip}`}>
            {p.promo_type}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm font-semibold text-slate-900 tabular-nums">
            {formatDiscount(p.discount_type, p.discount_value)}
          </div>
          {p.min_order_value !== null && p.min_order_value !== undefined && p.min_order_value > 0 && (
            <div className="text-[11px] text-slate-500">Min ₹{p.min_order_value}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${audienceChip}`}>
            {audienceLabel}
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
          <div>{formatDate(p.start_date)}</div>
          <div className="text-slate-400">— {formatDate(p.end_date)}</div>
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-700 tabular-nums">
          {(p.total_uses ?? 0).toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${statusChip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
            {p.status}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <VendorPromoActions id={p.id} status={p.status} />
        </td>
      </tr>
    );
  });

  const searchTexts = promos.map((p) =>
    `${p.title} ${p.description ?? ""} ${p.vendor_name ?? ""} ${p.restaurant_name ?? ""} ${p.promo_type} ${p.status} ${p.target_audience}`.toLowerCase()
  );

  const livePending = stats.pending;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Marketing · Vendor moderation
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Vendor promotions</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Promotions, banners and campaigns submitted by vendors for their own restaurants. Review for
              policy compliance and approve, reject, or pause.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Queue</div>
            <div className="text-lg font-bold tabular-nums">{stats.total.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-white/70">{livePending} pending review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Pending review" value={stats.pending} suffix="awaiting decision" accent="amber" href="/dashboard/vendor-promotions?status=pending" />
        <StatCard label="Approved" value={stats.approved} suffix="cleared for launch" accent="teal" href="/dashboard/vendor-promotions?status=approved" />
        <StatCard label="Live" value={stats.live} suffix="running now" accent="emerald" href="/dashboard/vendor-promotions?status=live" />
        <StatCard label="Rejected" value={stats.rejected} suffix="not allowed" accent="rose" href="/dashboard/vendor-promotions?status=rejected" />
        <StatCard label="Total" value={stats.total} suffix="all-time" accent="slate" href="/dashboard/vendor-promotions" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Status split</h3>
          <p className="text-xs text-slate-500 mt-0.5">All vendor promotions.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Promotions" centerValue={stats.total} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Filter</div>
            <FilterLink href="/dashboard/vendor-promotions" label="All" active={!statusFilter} />
            <FilterLink href="/dashboard/vendor-promotions?status=pending" label="Pending" active={statusFilter === "pending"} count={stats.pending} />
            <FilterLink href="/dashboard/vendor-promotions?status=approved" label="Approved" active={statusFilter === "approved"} count={stats.approved} />
            <FilterLink href="/dashboard/vendor-promotions?status=live" label="Live" active={statusFilter === "live"} count={stats.live} />
            <FilterLink href="/dashboard/vendor-promotions?status=rejected" label="Rejected" active={statusFilter === "rejected"} count={stats.rejected} />
          </div>
        </div>

        <PaginatedTable
          headerRow={headerRow}
          bodyRows={bodyRows}
          searchTexts={searchTexts}
          pageSize={10}
          searchable
          colCount={10}
          empty={statusFilter ? `No promotions with status "${statusFilter}".` : "No vendor promotions submitted yet."}
        />
      </div>
    </div>
  );
}

function StatCard({
  label, value, suffix, accent, href,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: "emerald" | "teal" | "amber" | "rose" | "slate";
  href?: string;
}) {
  const bg: Record<string, string> = {
    emerald: "from-emerald-50/60 to-white",
    teal: "from-teal-50/60 to-white",
    amber: "from-amber-50/60 to-white",
    rose: "from-rose-50/60 to-white",
    slate: "from-slate-50/60 to-white",
  };
  const inner = (
    <>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value.toLocaleString("en-IN")}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </>
  );
  const cls = `relative bg-gradient-to-b ${bg[accent]} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`;
  if (href) return <a href={href} className={cls + " block cursor-pointer"}>{inner}</a>;
  return <div className={cls}>{inner}</div>;
}

function FilterLink({ href, label, active, count }: { href: string; label: string; active?: boolean; count?: number }) {
  return (
    <a
      href={href}
      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs tabular-nums ${active ? "text-emerald-600" : "text-slate-400"}`}>{count}</span>
      )}
    </a>
  );
}
