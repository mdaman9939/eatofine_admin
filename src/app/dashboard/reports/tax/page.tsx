import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";

interface GstRow {
  sr_no: number;
  order_id: number;
  order_date: string | null;
  store: string | null;
  gst_on_food: number;
  gst_on_ppo: number;
  gst_on_additional: number;
  gst_on_delivery: number;
  gst_on_situational: number;
  total_gst: number;
}
interface GstReport {
  total: number;
  food_gst_rate: number;
  summary: { total_orders: number; food: number; ppo: number; additional: number; delivery: number; situational: number; total: number };
  rows: GstRow[];
}

function inr(n: number) {
  return `₹${(Math.round((Number(n) + Number.EPSILON) * 100) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function GstReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  const [gst, { zones, restaurants }] = await Promise.all([
    adminFetch<GstReport>(`/admin/reports/gst?${qs.toString()}`),
    reportFilterOptions(),
  ]);
  const s = gst.summary;
  const foodRate = gst.food_gst_rate ?? 5;

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="GST Report"
      description="GST collected per order, split by component — food items (sec 9(5)), PPO/commission, additional charges, delivery fee and situational charges. Filter by date range, zone or restaurant."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Total Orders", value: String(s.total_orders), accent: "slate" },
        { label: `GST on Food Items (${foodRate}%)`, value: inr(s.food), accent: "emerald" },
        { label: "GST on PPO Charges (18%)", value: inr(s.ppo), accent: "blue" },
        { label: "GST on Additional Charges (18%)", value: inr(s.additional), accent: "amber" },
        { label: "GST on Delivery Fee (18%)", value: inr(s.delivery), accent: "blue" },
        { label: "GST on Situational Charges (18%)", value: inr(s.situational), accent: "rose" },
        { label: "Total GST Collected", value: inr(s.total), accent: "emerald", hint: "all components" },
      ]}
      detailsTitle="GST collected — order-wise details"
      columns={[
        { key: "sr_no", label: "Sr. No." },
        { key: "order_id", label: "Order ID" },
        { key: "order_date", label: "Order Date" },
        { key: "store", label: "Store" },
        { key: "gst_on_food", label: `GST on Food Items (${foodRate}%)`, align: "right" },
        { key: "gst_on_ppo", label: "GST on PPO Charges (18%)", align: "right" },
        { key: "gst_on_additional", label: "GST on Additional Charges (18%)", align: "right" },
        { key: "gst_on_delivery", label: "GST on Delivery Fee (18%)", align: "right" },
        { key: "gst_on_situational", label: "GST on Situational Charges (18%)", align: "right" },
        { key: "total_gst", label: "Total GST Collected", align: "right" },
      ]}
      rows={gst.rows.map((r) => ({
        sr_no: r.sr_no,
        order_id: r.order_id,
        order_date: r.order_date,
        store: r.store,
        gst_on_food: inr(r.gst_on_food),
        gst_on_ppo: inr(r.gst_on_ppo),
        gst_on_additional: inr(r.gst_on_additional),
        gst_on_delivery: inr(r.gst_on_delivery),
        gst_on_situational: inr(r.gst_on_situational),
        total_gst: inr(r.total_gst),
      }))}
    />
  );
}
