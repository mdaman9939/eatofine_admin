import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { AdminEarningOrdersTable, type AdminEarningOrderRow } from "../../../../components/AdminEarningOrdersTable";
import { AdminExpenseOrdersTable, type AdminExpenseOrderRow } from "../../../../components/AdminExpenseOrdersTable";

interface AdminEarning {
  delivered_orders: number;
  gross_sales: number;
  total_tax: number;
  total_delivery_charges: number;
  admin_commission: number;
  restaurant_take: number;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }
function inr2(n: number) { return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default async function AdminEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  // Order-wise earning fetch also carries the Order Type filter.
  const earnQs = new URLSearchParams(qs);
  if (sp.order_type) earnQs.set("order_type", sp.order_type);
  const [data, earnOrders, expenseOrders, { zones, restaurants }] = await Promise.all([
    adminFetch<AdminEarning>(`/admin/reports/admin-earnings?${qs.toString()}`),
    adminFetch<{ total: number; rows: AdminEarningOrderRow[] }>(`/admin/reports/admin-earning-orders?${earnQs.toString()}`).catch(() => ({ total: 0, rows: [] as AdminEarningOrderRow[] })),
    adminFetch<{ total: number; rows: AdminExpenseOrderRow[] }>(`/admin/reports/admin-expense-orders?${earnQs.toString()}`).catch(() => ({ total: 0, rows: [] as AdminExpenseOrderRow[] })),
    reportFilterOptions(),
  ]);
  // Earning Summary — derived from the order-wise earning + expense tables.
  const totalEarnings = earnOrders.rows.reduce((s, r) => s + (Number(r.total_earning) || 0), 0);
  const totalExpenses = expenseOrders.rows.reduce((s, r) => s + (Number(r.total_expense) || 0), 0);
  const netProfit = totalEarnings - totalExpenses;

  return (
    <>
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Admin Earning & Expenses Report"
      description="Order-wise platform earning & expense — commission/PPO, delivery, additional & situational charges vs discount, delivery, bonus/incentive & situational expense. Filter by period, zone, restaurant or order type."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant showOrderType />}
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
    <div className="px-8 -mt-2">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Earning Summary <span className="text-xs font-normal text-slate-400">· total as per filter</span></h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow">
          <div className="text-sm font-semibold opacity-90">Total Earnings</div>
          <div className="mt-1 text-3xl font-bold">{inr2(totalEarnings)}</div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow">
          <div className="text-sm font-semibold opacity-90">Total Expenses</div>
          <div className="mt-1 text-3xl font-bold">{inr2(totalExpenses)}</div>
        </div>
        <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow">
          <div className="text-sm font-semibold opacity-90">Net Profit</div>
          <div className="mt-1 text-3xl font-bold">{inr2(netProfit)}</div>
        </div>
      </div>
    </div>
    <div className="px-8 pt-4 pb-4">
      <AdminEarningOrdersTable rows={earnOrders.rows} />
    </div>
    <div className="px-8 pb-8">
      <AdminExpenseOrdersTable rows={expenseOrders.rows} />
    </div>
    </>
  );
}
