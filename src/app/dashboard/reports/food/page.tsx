import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { FoodReportTable, type FoodReportRow } from "../../../../components/FoodReportTable";

interface FoodReport {
  total: number;
  rows: FoodReportRow[];
  yearly: Array<{ year: number; total: number }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function FoodReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  const { zones, restaurants } = await reportFilterOptions();
  let data: FoodReport = { total: 0, rows: [], yearly: [] };
  try {
    data = await adminFetch<FoodReport>(`/admin/reports/food-report?${qs.toString()}`);
  } catch { /* show empty state */ }

  const totalRevenue = data.rows.reduce((s, r) => s + r.total_amount_sold, 0);
  const totalUnits = data.rows.reduce((s, r) => s + r.order_count, 0);

  return (
    <>
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Food Report"
      description="Per-food sales — top-selling dishes, units moved, revenue contribution. Filter by zone, restaurant or category."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Items tracked", value: data.rows.length.toString(), accent: "blue" },
        { label: "Order count", value: totalUnits.toLocaleString("en-IN"), accent: "emerald" },
        { label: "Combined sold", value: inr(totalRevenue), accent: "amber" },
        { label: "Avg per item", value: data.rows.length ? inr(totalRevenue / data.rows.length) : "—", accent: "slate" },
      ]}
      detailsTitle="Food-wise sales details"
      columns={[
        { key: "rank", label: "#" },
        { key: "name", label: "Food" },
        { key: "restaurant", label: "Restaurant" },
        { key: "units", label: "Order count", align: "right" },
        { key: "revenue", label: "Total sold", align: "right" },
      ]}
      rows={data.rows.slice(0, 10).map((f, i) => ({
        rank: i + 1,
        name: f.name ?? `Food #${f.food_id}`,
        restaurant: f.restaurant ?? "—",
        units: f.order_count,
        revenue: inr(f.total_amount_sold),
      }))}
    />
    <div className="px-8 pb-8 -mt-2">
      <FoodReportTable rows={data.rows} yearly={data.yearly} />
    </div>
    </>
  );
}
