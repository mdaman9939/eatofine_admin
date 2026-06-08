import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";

interface TopFood {
  top_foods: Array<{
    food_id: number | null;
    name: string | null;
    restaurant_id: number | null;
    units_sold: number;
    revenue: number;
  }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function FoodReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  qs.set("limit", "50");
  let data: TopFood = { top_foods: [] };
  const { zones, restaurants } = await reportFilterOptions();
  try {
    data = await adminFetch<TopFood>(`/admin/reports/top-foods?${qs.toString()}`);
  } catch { /* endpoint optional — show empty state */ }
  const totalRevenue = data.top_foods.reduce((s, r) => s + r.revenue, 0);
  const totalUnits = data.top_foods.reduce((s, r) => s + r.units_sold, 0);

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Food Report"
      description="Per-food sales — top-selling dishes, units moved, revenue contribution. Filter by date range, zone or restaurant."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Items tracked", value: data.top_foods.length.toString(), accent: "blue" },
        { label: "Units sold", value: totalUnits.toLocaleString("en-IN"), accent: "emerald" },
        { label: "Combined revenue", value: inr(totalRevenue), accent: "amber" },
        { label: "Avg per item", value: data.top_foods.length ? inr(totalRevenue / data.top_foods.length) : "—", accent: "slate" },
      ]}
      detailsTitle="Food-wise sales details"
      columns={[
        { key: "rank", label: "#" },
        { key: "name", label: "Food" },
        { key: "restaurant", label: "Restaurant" },
        { key: "units", label: "Units sold", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
      ]}
      rows={data.top_foods.map((f, i) => ({
        rank: i + 1,
        name: f.name ?? `Food #${f.food_id}`,
        restaurant: f.restaurant_id ? `#${f.restaurant_id}` : "—",
        units: f.units_sold,
        revenue: inr(f.revenue),
      }))}
    />
  );
}
