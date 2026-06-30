import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions, deliverymanOptions } from "../../../../lib/reportFilters";
import {
  DeliverymanEarningTransactions,
  type EarningRow,
  type BonusRow,
} from "../../../../components/DeliverymanEarningTransactions";

interface DetailResponse {
  summary: {
    deliveries: number;
    delivery_fee: number;
    tips: number;
    situational: number;
    bonus_incentive: number;
    bonus_incentive_count: number;
    total_earning: number;
  };
  earnings: EarningRow[];
  bonus_incentive: BonusRow[];
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

const EMPTY: DetailResponse = {
  summary: { deliveries: 0, delivery_fee: 0, tips: 0, situational: 0, bonus_incentive: 0, bonus_incentive_count: 0, total_earning: 0 },
  earnings: [],
  bonus_incentive: [],
};

function EarningSummary({ s }: { s: DetailResponse["summary"] }) {
  const tiles = [
    { label: "Total Number of Deliveries", value: s.deliveries.toString() },
    { label: "Deliveries Fee", value: inr(s.delivery_fee) },
    { label: "Tips", value: inr(s.tips) },
    { label: "Bonus / Incentive", value: inr(s.bonus_incentive) },
    { label: "Situational Fee", value: inr(s.situational) },
    { label: "Total Earning", value: inr(s.total_earning) },
  ];
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">Earning Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{t.label}</div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{t.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function DeliverymanEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  qs.set("limit", "300");
  const [data, { zones }, deliverymen] = await Promise.all([
    adminFetch<DetailResponse>(`/admin/reports/deliveryman-earning-detail?${qs.toString()}`).catch(() => EMPTY),
    reportFilterOptions(),
    deliverymanOptions(),
  ]);

  return (
    <>
      <ReportTemplate
        badge="SYSTEM · REPORTS"
        title="Deliveryman Earning Report"
        description="Rider earnings — deliveries, delivery fees, tips, situational fee, plus bonus & incentive. Filter by period, zone or delivery man."
        filterBar={<ReportFilterBar zones={zones} deliverymen={deliverymen} showZone showDeliveryman />}
      />
      <div className="px-8 -mt-2 pb-8 space-y-6">
        <EarningSummary s={data.summary} />
        <DeliverymanEarningTransactions earnings={data.earnings} bonusIncentive={data.bonus_incentive} />
      </div>
    </>
  );
}
