import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { RestaurantEarningExpense, type RestaurantEarningExpenseData } from "../../../../components/RestaurantEarningExpense";

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

const EMPTY: RestaurantEarningExpenseData = {
  earnings: [],
  expenses: [],
  totals: { orders: 0, item_value: 0, total_earning: 0, admin_fee: 0, discount: 0, tds: 0, total_expense: 0 },
};

export default async function RestaurantEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  const [data, { zones, restaurants }] = await Promise.all([
    adminFetch<RestaurantEarningExpenseData>(`/admin/reports/restaurant-earning-detailed?${qs.toString()}`).catch(() => EMPTY),
    reportFilterOptions(),
  ]);
  const t = data.totals;

  return (
    <>
      <ReportTemplate
        badge="SYSTEM · REPORTS"
        title="Restaurant Earning & Expense Report"
        description="Per-order restaurant income — net item value MINUS admin fee (PPO/commission + 18% GST) MINUS restaurant-funded discount MINUS TDS. (Food GST is the government's, sec 9(5) — never the restaurant's.) Earning + Expense split into two tables. Filter by date range, zone or restaurant."
        filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
        stats={[
          { label: "Orders", value: t.orders.toLocaleString("en-IN"), accent: "blue" },
          { label: "Total item value", value: inr(t.item_value), accent: "slate" },
          { label: "Total earning (net)", value: inr(t.total_earning), accent: "emerald" },
          { label: "Total expense", value: inr(t.total_expense), accent: "rose" },
        ]}
      />
      <div className="px-8 pb-8 -mt-2">
        <RestaurantEarningExpense data={data} />
      </div>
    </>
  );
}
