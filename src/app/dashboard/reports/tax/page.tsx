import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";

interface Sales {
  days: number;
  total_revenue: number;
  total_orders: number;
  series: Array<{ day: string; revenue: number; orders: number; tax: number; delivery: number }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function TaxReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  const [sales, { zones, restaurants }] = await Promise.all([
    adminFetch<Sales>(`/admin/reports/sales-summary?${qs.toString()}`),
    reportFilterOptions(),
  ]);
  const totalTax = sales.series.reduce((s, r) => s + r.tax, 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="GST Report"
      description="GST collected on all orders. CGST + SGST split assumed for intra-state transactions (Haryana → Haryana). Filter by date range, zone or restaurant."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Period", value: `${sales.days} days`, accent: "slate" },
        { label: "Total GST", value: inr(totalTax), accent: "emerald", hint: "GST collected" },
        { label: "CGST (2.5%)", value: inr(cgst), accent: "blue" },
        { label: "SGST (2.5%)", value: inr(sgst), accent: "amber" },
      ]}
      detailsTitle="GST collected — day-wise details"
      columns={[
        { key: "day", label: "Date" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "tax", label: "GST", align: "right" },
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
