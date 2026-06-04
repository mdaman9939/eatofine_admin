import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";

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

export default async function DeliverymanEarningReportPage() {
  const data = await adminFetch<TopDM>("/admin/reports/top-deliverymen?limit=50");
  const totalCharges = data.top_delivery_men.reduce((s, r) => s + r.total_delivery_charges, 0);
  const totalTips = data.top_delivery_men.reduce((s, r) => s + r.total_tips, 0);

  return (
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Deliveryman Earning Report"
      description="Per-rider earnings breakdown — deliveries completed, delivery charges earned, customer tips."
      stats={[
        { label: "Active riders", value: data.top_delivery_men.length.toString(), accent: "blue" },
        { label: "Total delivery fees", value: inr(totalCharges), accent: "emerald" },
        { label: "Total tips", value: inr(totalTips), accent: "amber" },
        { label: "Avg per rider", value: data.top_delivery_men.length ? inr((totalCharges + totalTips) / data.top_delivery_men.length) : "—", accent: "slate" },
      ]}
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
