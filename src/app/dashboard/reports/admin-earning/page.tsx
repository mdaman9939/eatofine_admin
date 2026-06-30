import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { type AdminEarningOrderRow } from "../../../../components/AdminEarningOrdersTable";
import { type AdminExpenseOrderRow } from "../../../../components/AdminExpenseOrdersTable";
import { AdminEarnExpenseTabs } from "../../../../components/AdminEarnExpenseTabs";

function inr2(n: number) { return `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default async function AdminEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  // Order-wise fetches also carry the Order Type filter (Home Delivery / Take Away / Dine in).
  const earnQs = new URLSearchParams(qs);
  if (sp.order_type) earnQs.set("order_type", sp.order_type);
  const [earnOrders, expenseOrders, { zones, restaurants }] = await Promise.all([
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
        description="Order-wise platform earning (commission/PPO, delivery, additional & situational) and expense (discount, delivery, bonus/incentive & situational). Toggle Earnings / Expenses; filter by period, zone, restaurant or order type."
        filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant showOrderType />}
      />

      {/* Earning Summary — always-visible overview (Total Earnings / Total Expenses / Net Profit). */}
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

      {/* Earnings / Expenses toggle — each tab shows its own breakdown + order-wise table. */}
      <div className="px-8 pt-4 pb-8">
        <AdminEarnExpenseTabs earnRows={earnOrders.rows} expenseRows={expenseOrders.rows} />
      </div>
    </>
  );
}
