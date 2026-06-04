import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

interface Sales {
  days: number;
  total_revenue: number;
  total_orders: number;
  series: Array<{ day: string; revenue: number; orders: number; tax: number; delivery: number }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function OrderReportPage() {
  const sales = await adminFetch<Sales>("/admin/reports/sales-summary?days=30");
  const avgOrders = sales.days ? sales.total_orders / sales.days : 0;
  const aov = sales.total_orders ? sales.total_revenue / sales.total_orders : 0;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Order Report"
      description="Day-wise order volume + revenue trend. Use to spot daily / weekly patterns."
      stats={[
        { label: "Period", value: `${sales.days} days`, accent: "slate" },
        { label: "Total orders", value: sales.total_orders.toString(), accent: "blue" },
        { label: "Avg orders/day", value: avgOrders.toFixed(1), accent: "amber" },
        { label: "Avg order value", value: inr(aov), accent: "emerald" },
      ]}
      columns={[
        { key: "day", label: "Date" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "aov", label: "AOV", align: "right" },
      ]}
      rows={sales.series.map((r) => ({
        day: r.day,
        orders: r.orders,
        revenue: inr(r.revenue),
        aov: inr(r.orders ? r.revenue / r.orders : 0),
      }))}
    />
  );
}
