import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";

interface TopRestaurants {
  top_earners: Array<{
    restaurant_id: number;
    name: string | null;
    orders: number;
    revenue: number;
    admin_commission: number;
    restaurant_take: number;
  }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function RestaurantEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  qs.set("limit", "50");
  const [data, { zones, restaurants }] = await Promise.all([
    adminFetch<TopRestaurants>(`/admin/reports/restaurant-earnings?${qs.toString()}`),
    reportFilterOptions(),
  ]);
  const totalRevenue = data.top_earners.reduce((s, r) => s + r.revenue, 0);
  const totalTake = data.top_earners.reduce((s, r) => s + r.restaurant_take, 0);

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Restaurant Earning Report"
      description="Per-restaurant performance breakdown — orders, gross revenue, admin commission, restaurant's net payout. Filter by date range, zone or restaurant."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Restaurants", value: data.top_earners.length.toString(), accent: "blue" },
        { label: "Combined revenue", value: inr(totalRevenue), accent: "emerald" },
        { label: "Combined restaurant take", value: inr(totalTake), accent: "amber" },
        { label: "Avg per restaurant", value: data.top_earners.length ? inr(totalTake / data.top_earners.length) : "—", accent: "slate" },
      ]}
      detailsTitle="Restaurant earning details"
      columns={[
        { key: "rank", label: "#" },
        { key: "name", label: "Restaurant" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "commission", label: "Admin %", align: "right" },
        { key: "take", label: "Net to restaurant", align: "right" },
      ]}
      rows={data.top_earners.map((r, i) => ({
        rank: i + 1,
        name: r.name ?? `#${r.restaurant_id}`,
        orders: r.orders,
        revenue: inr(r.revenue),
        commission: inr(r.admin_commission),
        take: inr(r.restaurant_take),
      }))}
    />
  );
}
