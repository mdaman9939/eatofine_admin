import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

interface AdminEarning {
  delivered_orders: number;
  gross_sales: number;
  total_tax: number;
  total_delivery_charges: number;
  admin_commission: number;
  restaurant_take: number;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function AdminEarningReportPage() {
  const data = await adminFetch<AdminEarning>("/admin/reports/admin-earnings?days=30");

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Admin Earning Report"
      description="Platform-level earnings — commission income, tax collected, delivery margin. Last 30 days."
      stats={[
        { label: "Delivered orders", value: data.delivered_orders.toString(), accent: "blue" },
        { label: "Admin commission", value: inr(data.admin_commission), accent: "emerald", hint: "Platform revenue" },
        { label: "Tax collected", value: inr(data.total_tax), accent: "amber", hint: "Passthrough to gov" },
        { label: "Delivery charges", value: inr(data.total_delivery_charges), accent: "slate" },
      ]}
      columns={[
        { key: "metric", label: "Metric" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "share", label: "% of gross", align: "right" },
      ]}
      rows={[
        { metric: "Gross sales", amount: inr(data.gross_sales), share: "100.0%" },
        { metric: "Admin commission", amount: inr(data.admin_commission), share: data.gross_sales ? `${(data.admin_commission / data.gross_sales * 100).toFixed(1)}%` : "—" },
        { metric: "Restaurant take", amount: inr(data.restaurant_take), share: data.gross_sales ? `${(data.restaurant_take / data.gross_sales * 100).toFixed(1)}%` : "—" },
        { metric: "Tax collected", amount: inr(data.total_tax), share: data.gross_sales ? `${(data.total_tax / data.gross_sales * 100).toFixed(1)}%` : "—" },
        { metric: "Delivery charges", amount: inr(data.total_delivery_charges), share: data.gross_sales ? `${(data.total_delivery_charges / data.gross_sales * 100).toFixed(1)}%` : "—" },
      ]}
    />
  );
}
