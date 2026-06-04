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

export default async function ExpenseReportPage() {
  const data = await adminFetch<AdminEarning>("/admin/reports/admin-earnings?days=30");

  // Admin's outgoing payments = what we paid to restaurants + delivery + tax remitted.
  const restaurantPayout = data.restaurant_take;
  const taxRemitted = data.total_tax;
  const deliveryCost = data.total_delivery_charges;
  const totalOutgoing = restaurantPayout + taxRemitted + deliveryCost;
  const netRevenue = data.gross_sales - totalOutgoing;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Expense Report"
      description="Admin's outgoing payments — what the platform pays to restaurants, delivery men, and the government. Subtract from gross to get net revenue."
      stats={[
        { label: "Gross sales", value: inr(data.gross_sales), accent: "blue" },
        { label: "Total outgoing", value: inr(totalOutgoing), accent: "rose", hint: "What admin pays" },
        { label: "Net revenue", value: inr(netRevenue), accent: "emerald", hint: "Platform's keep" },
        { label: "Outgoing %", value: data.gross_sales ? `${(totalOutgoing / data.gross_sales * 100).toFixed(1)}%` : "—", accent: "amber" },
      ]}
      columns={[
        { key: "type", label: "Expense type" },
        { key: "amount", label: "Amount", align: "right" },
        { key: "share", label: "% of gross", align: "right" },
        { key: "note", label: "Note" },
      ]}
      rows={[
        { type: "Restaurant payouts", amount: inr(restaurantPayout), share: data.gross_sales ? `${(restaurantPayout / data.gross_sales * 100).toFixed(1)}%` : "—", note: "Net to restaurants after commission" },
        { type: "Delivery charges", amount: inr(deliveryCost), share: data.gross_sales ? `${(deliveryCost / data.gross_sales * 100).toFixed(1)}%` : "—", note: "Passed to delivery men" },
        { type: "Tax remitted", amount: inr(taxRemitted), share: data.gross_sales ? `${(taxRemitted / data.gross_sales * 100).toFixed(1)}%` : "—", note: "GST passthrough to government" },
        { type: "Total", amount: inr(totalOutgoing), share: data.gross_sales ? `${(totalOutgoing / data.gross_sales * 100).toFixed(1)}%` : "—", note: "" },
      ]}
    />
  );
}
