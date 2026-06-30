import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { TransactionReportTable, type TxnReportRow } from "../../../../components/TransactionReportTable";

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
  // Detailed per-order report query carries the extra filters too.
  const rqs = new URLSearchParams(qs.toString());
  if (sp.order_type) rqs.set("order_type", sp.order_type);
  if (sp.category) rqs.set("category", sp.category);
  if (sp.order_status) rqs.set("order_status", sp.order_status);

  const [sales, txn, zonesRes, restaurantsRes] = await Promise.all([
    adminFetch<Sales>(`/admin/reports/sales-summary?${qs.toString()}`),
    adminFetch<{ total: number; rows: TxnReportRow[] }>(`/admin/reports/transaction-report?${rqs.toString()}`).catch(() => ({ total: 0, rows: [] as TxnReportRow[] })),
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
      description="Full money breakdown for every order — item cost, all discounts, GST split (item / additional charge / delivery / situational), tips, restaurant income, TDS, and admin income from restaurant & user. Filter by period, zone, restaurant, order type, category (all / campaign) or order status; export the whole table to CSV. The summary below the filters stays day-wise for a quick trend view."
      filterBar={<ReportFilterBar zones={zoneOptions} restaurants={restOptions} showZone showRestaurant showOrderType showCategory showStatus />}
      stats={[
        { label: "Days in range", value: sales.series.length.toString(), accent: "slate" },
        { label: "Total revenue", value: inr(sales.total_revenue), accent: "emerald" },
        { label: "Total orders", value: sales.total_orders.toString(), accent: "blue" },
        { label: "GST + delivery", value: inr(totalTax + totalDelivery), accent: "amber" },
      ]}
    />
    <div className="px-8 pb-8 -mt-2">
      {/* Per-order detailed table — the client's Excel "Transaction Report" format. */}
      <TransactionReportTable rows={txn.rows} />
    </div>
    </>
  );
}
