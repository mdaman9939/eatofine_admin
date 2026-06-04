import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

interface Sales {
  days: number;
  total_revenue: number;
  total_orders: number;
  series: Array<{ day: string; revenue: number; orders: number; tax: number; delivery: number }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function TransactionReportPage() {
  const sales = await adminFetch<Sales>("/admin/reports/sales-summary?days=30");
  const totalTax = sales.series.reduce((s, r) => s + r.tax, 0);
  const totalDelivery = sales.series.reduce((s, r) => s + r.delivery, 0);

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Transaction Report"
      description="Day-wise transactions across the platform — gross sales, tax collected, delivery charges, order count. Used for daily reconciliation."
      stats={[
        { label: "Period", value: `${sales.days} days`, accent: "slate" },
        { label: "Total revenue", value: inr(sales.total_revenue), accent: "emerald" },
        { label: "Total orders", value: sales.total_orders.toString(), accent: "blue" },
        { label: "Tax + delivery", value: inr(totalTax + totalDelivery), accent: "amber" },
      ]}
      columns={[
        { key: "day", label: "Date" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "tax", label: "Tax", align: "right" },
        { key: "delivery", label: "Delivery", align: "right" },
      ]}
      rows={sales.series.map((r) => ({
        day: r.day,
        orders: r.orders,
        revenue: inr(r.revenue),
        tax: inr(r.tax),
        delivery: inr(r.delivery),
      }))}
    />
  );
}
