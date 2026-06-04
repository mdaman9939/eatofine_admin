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

export default async function RestaurantEarningReportPage() {
  const data = await adminFetch<TopRestaurants>("/admin/reports/restaurant-earnings?limit=50");
  const totalRevenue = data.top_earners.reduce((s, r) => s + r.revenue, 0);
  const totalTake = data.top_earners.reduce((s, r) => s + r.restaurant_take, 0);

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Restaurant Earning Report"
      description="Per-restaurant performance breakdown — orders, gross revenue, admin commission, restaurant's net payout."
      stats={[
        { label: "Restaurants", value: data.top_earners.length.toString(), accent: "blue" },
        { label: "Combined revenue", value: inr(totalRevenue), accent: "emerald" },
        { label: "Combined restaurant take", value: inr(totalTake), accent: "amber" },
        { label: "Avg per restaurant", value: data.top_earners.length ? inr(totalTake / data.top_earners.length) : "—", accent: "slate" },
      ]}
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
