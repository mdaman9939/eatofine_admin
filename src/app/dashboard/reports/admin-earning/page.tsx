import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { AdminEarningDetailed, type AdminEarningData } from "../../../../components/AdminEarningDetailed";

interface AdminEarning {
  delivered_orders: number;
  gross_sales: number;
  total_tax: number;
  total_delivery_charges: number;
  admin_commission: number;
  restaurant_take: number;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function AdminEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  const [data, detailed, { zones, restaurants }] = await Promise.all([
    adminFetch<AdminEarning>(`/admin/reports/admin-earnings?${qs.toString()}`),
    adminFetch<AdminEarningData>(`/admin/reports/admin-earning-detailed`).catch(() => null),
    reportFilterOptions(),
  ]);

  return (
    <>
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Admin Earning Report"
      description="Platform-level earnings — commission income, tax collected, delivery margin. Filter by date range, zone or restaurant."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Delivered orders", value: data.delivered_orders.toString(), accent: "blue" },
        { label: "Admin commission", value: inr(data.admin_commission), accent: "emerald", hint: "Platform revenue" },
        { label: "GST collected", value: inr(data.total_tax), accent: "amber", hint: "Passthrough to gov" },
        { label: "Delivery charges", value: inr(data.total_delivery_charges), accent: "slate" },
      ]}
      detailsTitle="Admin earning breakdown"
      columns={[
        { key: "metric", label: "Metric" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "share", label: "% of gross", align: "right" },
      ]}
      rows={[
        { metric: "Gross sales", amount: inr(data.gross_sales), share: "100.0%" },
        { metric: "Admin commission", amount: inr(data.admin_commission), share: data.gross_sales ? `${(data.admin_commission / data.gross_sales * 100).toFixed(1)}%` : "—" },
        { metric: "Restaurant take", amount: inr(data.restaurant_take), share: data.gross_sales ? `${(data.restaurant_take / data.gross_sales * 100).toFixed(1)}%` : "—" },
        { metric: "GST collected", amount: inr(data.total_tax), share: data.gross_sales ? `${(data.total_tax / data.gross_sales * 100).toFixed(1)}%` : "—" },
        { metric: "Delivery charges", amount: inr(data.total_delivery_charges), share: data.gross_sales ? `${(data.total_delivery_charges / data.gross_sales * 100).toFixed(1)}%` : "—" },
      ]}
    />
    {detailed && (
      <div className="px-8 pb-8 -mt-2">
        <AdminEarningDetailed data={detailed} />
      </div>
    )}
    </>
  );
}
