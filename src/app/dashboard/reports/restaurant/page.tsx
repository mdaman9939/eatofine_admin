import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

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

export default async function RestaurantReportPage() {
  const data = await adminFetch<TopRestaurants>("/admin/reports/restaurant-earnings?limit=50");
  const totalOrders = data.top_earners.reduce((s, r) => s + r.orders, 0);
  const totalRevenue = data.top_earners.reduce((s, r) => s + r.revenue, 0);
  const avgAov = totalOrders ? totalRevenue / totalOrders : 0;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Restaurant Report"
      description="Per-restaurant performance — orders, revenue, average ticket size, market share."
      stats={[
        { label: "Restaurants", value: data.top_earners.length.toString(), accent: "blue" },
        { label: "Total orders", value: totalOrders.toString(), accent: "emerald" },
        { label: "Total revenue", value: inr(totalRevenue), accent: "amber" },
        { label: "Avg AOV", value: inr(avgAov), accent: "slate" },
      ]}
      columns={[
        { key: "rank", label: "#" },
        { key: "name", label: "Restaurant" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "aov", label: "AOV", align: "right" },
        { key: "share", label: "Share %", align: "right" },
      ]}
      rows={data.top_earners.map((r, i) => ({
        rank: i + 1,
        name: r.name ?? `Restaurant #${r.restaurant_id}`,
        orders: r.orders,
        revenue: inr(r.revenue),
        aov: inr(r.orders ? r.revenue / r.orders : 0),
        share: totalRevenue ? `${(r.revenue / totalRevenue * 100).toFixed(1)}%` : "—",
      }))}
    />
  );
}
