import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { TransactionDetailsTable, type TxnRow } from "../../../../components/TransactionDetailsTable";

interface Sales {
  days: number;
  total_revenue: number;
  total_orders: number;
  series: Array<{ day: string; revenue: number; orders: number; tax: number; delivery: number }>;
}

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function TransactionReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp.from) qs.set("from", sp.from);
  if (sp.to) qs.set("to", sp.to);
  if (sp.days) qs.set("days", sp.days);
  if (!sp.from && !sp.days) qs.set("days", "30");
  if (sp.zone_id) qs.set("zone_id", sp.zone_id);
  if (sp.restaurant_id) qs.set("restaurant_id", sp.restaurant_id);

  const [sales, txn, zonesRes, restaurantsRes] = await Promise.all([
    adminFetch<Sales>(`/admin/reports/sales-summary?${qs.toString()}`),
    adminFetch<{ total: number; rows: TxnRow[] }>(`/admin/reports/transaction-details?${qs.toString()}`).catch(() => ({ total: 0, rows: [] as TxnRow[] })),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
  ]);
  const totalTax = sales.series.reduce((s, r) => s + r.tax, 0);
  const totalDelivery = sales.series.reduce((s, r) => s + r.delivery, 0);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const restOptions = (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` }));

  return (
    <>
    <ReportTemplate
      badge="SYSTEM · REPORTS"
      title="Transaction Report"
      description="Day-wise transactions — gross sales, tax, delivery charges, order count. Filter by date range, zone or restaurant; export to CSV."
      filterBar={<ReportFilterBar zones={zoneOptions} restaurants={restOptions} showZone showRestaurant />}
      stats={[
        { label: "Days in range", value: sales.series.length.toString(), accent: "slate" },
        { label: "Total revenue", value: inr(sales.total_revenue), accent: "emerald" },
        { label: "Total orders", value: sales.total_orders.toString(), accent: "blue" },
        { label: "GST + delivery", value: inr(totalTax + totalDelivery), accent: "amber" },
      ]}
      detailsTitle="Transaction details — day-wise"
      columns={[
        { key: "day", label: "Date" },
        { key: "orders", label: "Orders", align: "right" },
        { key: "revenue", label: "Revenue", align: "right" },
        { key: "tax", label: "GST", align: "right" },
        { key: "delivery", label: "Delivery", align: "right" },
      ]}
      rows={sales.series.map((r) => ({
        day: r.day,
        orders: r.orders,
        revenue: inr(r.revenue),
        tax: inr(r.tax),
        delivery: inr(r.delivery),
      }))}
    />
    <div className="px-8 pb-8 -mt-2">
      <TransactionDetailsTable rows={txn.rows} />
    </div>
    </>
  );
}
