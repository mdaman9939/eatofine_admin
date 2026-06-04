import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

interface TopCustomers {
  top_customers: Array<{
    user_id: number | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    orders: number;
    total_spend: number;
  }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function CustomerReportPage() {
  const data = await adminFetch<TopCustomers>("/admin/reports/top-customers?limit=50");
  const totalSpend = data.top_customers.reduce((s, r) => s + r.total_spend, 0);
  const totalOrders = data.top_customers.reduce((s, r) => s + r.orders, 0);
  const aov = totalOrders ? totalSpend / totalOrders : 0;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Customer Report"
      description="Top customers by spend + orders. Useful for VIP outreach, loyalty rewards, churn detection."
      stats={[
        { label: "Customers shown", value: data.top_customers.length.toString(), accent: "blue" },
        { label: "Combined spend", value: inr(totalSpend), accent: "emerald" },
        { label: "Combined orders", value: totalOrders.toString(), accent: "amber" },
        { label: "Average order value", value: inr(aov), accent: "slate" },
      ]}
      columns={[
        { key: "rank", label: "#" },
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "spend", label: "Spend", align: "right" },
      ]}
      rows={data.top_customers.map((c, i) => ({
        rank: i + 1,
        name: c.name ?? `Customer #${c.user_id}`,
        email: c.email ?? "—",
        phone: c.phone ?? "—",
        orders: c.orders,
        spend: inr(c.total_spend),
      }))}
    />
  );
}
