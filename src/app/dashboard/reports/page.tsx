import { adminFetch } from "../../../lib/api";
import { fmtMoney } from "../../../components/TablePage";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";

interface Sales {
  days: number;
  total_revenue: number;
  total_orders: number;
  series: Array<{ day: string; revenue: number; orders: number; tax: number; delivery: number }>;
}
interface AdminEarning {
  delivered_orders: number;
  gross_sales: number;
  total_tax: number;
  total_delivery_charges: number;
  admin_commission: number;
  restaurant_take: number;
}
interface TopRestaurants {
  top_earners: Array<{ restaurant_id: number; name: string | null; orders: number; revenue: number; admin_commission: number; restaurant_take: number }>;
}
interface TopCustomers {
  top_customers: Array<{ user_id: number | null; name: string | null; email: string | null; phone: string | null; orders: number; total_spend: number }>;
}
interface TopDM {
  top_delivery_men: Array<{ delivery_man_id: number | null; name: string | null; phone: string | null; zone_id: number | null; deliveries: number; total_tips: number; total_delivery_charges: number }>;
}

export default async function ReportsPage() {
  const [sales, adminEarning, topRestaurants, topCustomers, topDM] = await Promise.all([
    adminFetch<Sales>("/admin/reports/sales-summary?days=30"),
    adminFetch<AdminEarning>("/admin/reports/admin-earnings?days=30"),
    adminFetch<TopRestaurants>("/admin/reports/restaurant-earnings?limit=10"),
    adminFetch<TopCustomers>("/admin/reports/top-customers?limit=10"),
    adminFetch<TopDM>("/admin/reports/top-deliverymen?limit=10"),
  ]);

  const moneySplit = [
    { label: "Restaurant take", value: adminEarning.restaurant_take, color: DONUT_PALETTE.emerald },
    { label: "Admin commission", value: adminEarning.admin_commission, color: DONUT_PALETTE.teal },
    { label: "Tax collected", value: adminEarning.total_tax, color: DONUT_PALETTE.amber },
    { label: "Delivery charges", value: adminEarning.total_delivery_charges, color: DONUT_PALETTE.sky },
  ].filter((s) => s.value > 0);

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
              Reports · Last 30 days
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Platform reports</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Sales rollups across delivered orders, the admin&apos;s share, and the people driving the business —
              top restaurants, customers, and riders.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Gross sales</div>
            <div className="text-lg font-bold tabular-nums">{fmtMoney(adminEarning.gross_sales)}</div>
            <div className="text-[11px] text-white/70">{adminEarning.delivered_orders} delivered orders</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Gross sales" value={fmtMoney(adminEarning.gross_sales)} accent="emerald" />
        <Stat label="Admin commission" value={fmtMoney(adminEarning.admin_commission)} accent="teal" />
        <Stat label="Restaurant take" value={fmtMoney(adminEarning.restaurant_take)} accent="emerald" />
        <Stat label="Tax collected" value={fmtMoney(adminEarning.total_tax)} accent="teal" />
        <Stat label="Delivery charges" value={fmtMoney(adminEarning.total_delivery_charges)} accent="emerald" />
        <Stat label="Delivered orders" value={adminEarning.delivered_orders.toString()} accent="teal" />
        <Stat label="Orders (period)" value={sales.total_orders.toString()} accent="emerald" />
        <Stat label="Revenue (period)" value={fmtMoney(sales.total_revenue)} accent="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Where the rupee goes</h3>
          <p className="text-xs text-slate-500 mt-0.5">GMV breakdown across stakeholders.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={moneySplit} centerLabel="GMV" centerValue="100%" />
          </div>
          <div className="mt-5">
            <DonutLegend slices={moneySplit} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Daily sales</h2>
              <p className="text-xs text-slate-500 mt-0.5">Day-by-day delivered orders, revenue, tax and delivery fees.</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
              {sales.series.length} {sales.series.length === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="overflow-auto max-h-[520px]">
            {sales.series.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">No delivered orders in this window.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Day</th>
                    <th className="px-4 py-3 font-semibold text-right">Orders</th>
                    <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                    <th className="px-4 py-3 font-semibold text-right">Tax</th>
                    <th className="px-4 py-3 font-semibold text-right">Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.series.map((row) => (
                    <tr key={row.day} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.day}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{row.orders}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-800">{fmtMoney(row.revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtMoney(row.tax)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{fmtMoney(row.delivery)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopList
          title="Top restaurants"
          subtitle="By revenue"
          items={topRestaurants.top_earners.map((r) => ({
            id: r.restaurant_id,
            primary: r.name ?? `#${r.restaurant_id}`,
            secondary: `${r.orders} orders · cmsn ${fmtMoney(r.admin_commission)}`,
            value: fmtMoney(r.revenue),
          }))}
        />
        <TopList
          title="Top customers"
          subtitle="By total spend"
          items={topCustomers.top_customers.map((c, i) => ({
            id: c.user_id ?? i,
            primary: c.name ?? c.email ?? c.phone ?? "—",
            secondary: `${c.orders} orders`,
            value: fmtMoney(c.total_spend),
          }))}
        />
        <TopList
          title="Top delivery men"
          subtitle="By delivered orders"
          items={topDM.top_delivery_men.map((d, i) => ({
            id: d.delivery_man_id ?? i,
            primary: d.name ?? d.phone ?? "—",
            secondary: `Zone ${d.zone_id ?? "—"} · tips ${fmtMoney(d.total_tips)}`,
            value: `${d.deliveries} runs`,
          }))}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: "emerald" | "teal" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 to-white",
    teal: "from-teal-50/60 to-white",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-900 tabular-nums tracking-tight">{value}</div>
    </div>
  );
}

function TopList({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ id: number | string; primary: string; secondary: string; value: string }>;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <ol className="divide-y divide-slate-100">
        {items.length === 0 && <li className="px-5 py-6 text-sm text-slate-400 text-center">No data yet.</li>}
        {items.map((it, i) => (
          <li key={it.id} className="px-5 py-3 hover:bg-emerald-50/40 transition-colors flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center border border-emerald-200">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate">{it.primary}</div>
              <div className="text-[11px] text-slate-500">{it.secondary}</div>
            </div>
            <div className="text-sm font-bold text-slate-900 tabular-nums shrink-0">{it.value}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
