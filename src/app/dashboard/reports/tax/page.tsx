import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

interface Sales {
  days: number;
  total_revenue: number;
  total_orders: number;
  series: Array<{ day: string; revenue: number; orders: number; tax: number; delivery: number }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function TaxReportPage() {
  const sales = await adminFetch<Sales>("/admin/reports/sales-summary?days=30");
  const totalTax = sales.series.reduce((s, r) => s + r.tax, 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Tax Report"
      description="GST collected on all orders. CGST + SGST split assumed for intra-state transactions (Haryana → Haryana)."
      stats={[
        { label: "Period", value: `${sales.days} days`, accent: "slate" },
        { label: "Total tax", value: inr(totalTax), accent: "emerald", hint: "GST collected" },
        { label: "CGST (2.5%)", value: inr(cgst), accent: "blue" },
        { label: "SGST (2.5%)", value: inr(sgst), accent: "amber" },
      ]}
      columns={[
        { key: "day", label: "Date" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "tax", label: "Tax", align: "right" },
        { key: "cgst", label: "CGST", align: "right" },
        { key: "sgst", label: "SGST", align: "right" },
      ]}
      rows={sales.series.map((r) => ({
        day: r.day,
        revenue: inr(r.revenue),
        tax: inr(r.tax),
        cgst: inr(r.tax / 2),
        sgst: inr(r.tax / 2),
      }))}
    />
  );
}
