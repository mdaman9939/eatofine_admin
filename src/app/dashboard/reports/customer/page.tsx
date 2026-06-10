import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { CustomerOverviewTable, type CustomerRow, type CustomerStats } from "../../../../components/CustomerOverviewTable";
import { CustomerWalletReport, type WalletTxn, type WalletTotals } from "../../../../components/CustomerWalletReport";

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

export default async function CustomerReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  qs.set("limit", "50");
  const [data, overview, wallet, { zones, restaurants }] = await Promise.all([
    adminFetch<TopCustomers>(`/admin/reports/top-customers?${qs.toString()}`),
    adminFetch<{ total: number; rows: CustomerRow[]; stats: CustomerStats }>(`/admin/reports/customer-report`).catch(() => ({ total: 0, rows: [] as CustomerRow[], stats: { total_customers: 0, new_customers: 0, active: 0, inactive: 0, returning: 0 } })),
    adminFetch<{ total: number; rows: WalletTxn[]; totals: WalletTotals }>(`/admin/reports/customer-wallet-report`).catch(() => ({ total: 0, rows: [] as WalletTxn[], totals: { credit: 0, debit: 0, balance: 0 } })),
    reportFilterOptions(),
  ]);
  const totalSpend = data.top_customers.reduce((s, r) => s + r.total_spend, 0);
  const totalOrders = data.top_customers.reduce((s, r) => s + r.orders, 0);
  const aov = totalOrders ? totalSpend / totalOrders : 0;

  return (
    <>
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Customer Report"
      description="Top customers by spend + orders. Filter by date range, zone or restaurant. Useful for VIP outreach, loyalty rewards, churn detection."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Customers shown", value: data.top_customers.length.toString(), accent: "blue" },
        { label: "Combined spend", value: inr(totalSpend), accent: "emerald" },
        { label: "Combined orders", value: totalOrders.toString(), accent: "amber" },
        { label: "Average order value", value: inr(aov), accent: "slate" },
      ]}
      detailsTitle="Customer details"
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
    <div className="px-8 pb-8 -mt-2 space-y-8">
      <CustomerOverviewTable rows={overview.rows} stats={overview.stats} />
      <CustomerWalletReport rows={wallet.rows} totals={wallet.totals} />
    </div>
    </>
  );
}
