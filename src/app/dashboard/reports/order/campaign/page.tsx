import { adminFetch } from "../../../../../lib/api";
import { ReportTemplate } from "../../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../../components/ReportFilterBar";
import { OrderReportTable, type OrderReportRow } from "../../../../../components/OrderReportTable";

export default async function CampaignOrderReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.from) qs.set("from", sp.from);
  if (sp.to) qs.set("to", sp.to);
  if (sp.days) qs.set("days", sp.days);
  if (!sp.from && !sp.days) qs.set("days", "365");
  if (sp.zone_id) qs.set("zone_id", sp.zone_id);
  if (sp.restaurant_id) qs.set("restaurant_id", sp.restaurant_id);
  qs.set("campaign", "1"); // only campaign orders

  const [orderRep, zonesRes, restaurantsRes] = await Promise.all([
    adminFetch<{ total: number; rows: OrderReportRow[]; status_counts: Record<string, number> }>(`/admin/reports/order-report?${qs.toString()}`).catch(() => ({ total: 0, rows: [] as OrderReportRow[], status_counts: {} as Record<string, number> })),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const restOptions = (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` }));

  return (
    <>
      <ReportTemplate
        badge="SYSTEM · REPORTS · CAMPAIGN"
        title="Campaign Order Report"
        description="Orders placed against running campaigns (campaign / promotional items). Filter by date range, zone or restaurant; export to CSV."
        filterBar={<ReportFilterBar zones={zoneOptions} restaurants={restOptions} showZone showRestaurant />}
      />
      <div className="px-8 pb-8 -mt-2">
        {orderRep.rows.length === 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No campaign orders yet. Orders that include a campaign item will appear here automatically.
          </div>
        )}
        <OrderReportTable rows={orderRep.rows} statusCounts={orderRep.status_counts} />
      </div>
    </>
  );
}
