import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";

interface TopDM {
  top_delivery_men: Array<{
    delivery_man_id: number | null;
    name: string | null;
    phone: string | null;
    zone_id: number | null;
    deliveries: number;
    total_tips: number;
    total_delivery_charges: number;
  }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function DeliverymanEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  qs.set("limit", "50");
  const [data, { zones, restaurants }] = await Promise.all([
    adminFetch<TopDM>(`/admin/reports/top-deliverymen?${qs.toString()}`),
    reportFilterOptions(),
  ]);
  const totalCharges = data.top_delivery_men.reduce((s, r) => s + r.total_delivery_charges, 0);
  const totalTips = data.top_delivery_men.reduce((s, r) => s + r.total_tips, 0);

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Deliveryman Earning Report"
      description="Per-rider earnings breakdown — deliveries completed, delivery charges earned, customer tips. Filter by date range, zone or restaurant."
      filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
      stats={[
        { label: "Active riders", value: data.top_delivery_men.length.toString(), accent: "blue" },
        { label: "Total delivery fees", value: inr(totalCharges), accent: "emerald" },
        { label: "Total tips", value: inr(totalTips), accent: "amber" },
        { label: "Avg per rider", value: data.top_delivery_men.length ? inr((totalCharges + totalTips) / data.top_delivery_men.length) : "—", accent: "slate" },
      ]}
      detailsTitle="Deliveryman earning details"
      columns={[
        { key: "rank", label: "#" },
        { key: "name", label: "Rider" },
        { key: "phone", label: "Phone" },
        { key: "zone", label: "Zone" },
        { key: "deliveries", label: "Deliveries", align: "right" },
        { key: "charges", label: "Delivery fees", align: "right" },
        { key: "tips", label: "Tips", align: "right" },
        { key: "total", label: "Total earned", align: "right" },
      ]}
      rows={data.top_delivery_men.map((r, i) => ({
        rank: i + 1,
        name: r.name ?? `DM #${r.delivery_man_id}`,
        phone: r.phone ?? "—",
        zone: r.zone_id ? `#${r.zone_id}` : "—",
        deliveries: r.deliveries,
        charges: inr(r.total_delivery_charges),
        tips: inr(r.total_tips),
        total: inr(r.total_delivery_charges + r.total_tips),
      }))}
    />
  );
}
