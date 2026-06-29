import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { PaginatedTable } from "../../../../components/PaginatedTable";
import { CsvExportButton } from "../../../../components/CsvExportButton";

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

  // CSV columns + raw-number rows (clean values for Excel).
  const csvColumns = [
    { key: "sr_no", label: "Sr. No." },
    { key: "order_id", label: "Order ID" },
    { key: "order_date", label: "Order Date" },
    { key: "store", label: "Store" },
    { key: "gst_on_food", label: `GST on Food Items (${foodRate}%)` },
    { key: "gst_on_ppo", label: "GST on PPO Charges (18%)" },
    { key: "gst_on_additional", label: "GST on Additional Charges (18%)" },
    { key: "gst_on_delivery", label: "GST on Delivery Fee (18%)" },
    { key: "gst_on_situational", label: "GST on Situational Charges (18%)" },
    { key: "total_gst", label: "Total GST Collected" },
  ];
  const csvRows = gst.rows.map((r) => ({ ...r }));

  // Paginated table (search by order id / store / date).
  const headerRow = (
    <tr>
      <th className="px-4 py-3 font-semibold">Sr. No.</th>
      <th className="px-4 py-3 font-semibold">Order ID</th>
      <th className="px-4 py-3 font-semibold">Order Date</th>
      <th className="px-4 py-3 font-semibold">Store</th>
      <th className="px-4 py-3 font-semibold text-right">GST on Food Items ({foodRate}%)</th>
      <th className="px-4 py-3 font-semibold text-right">GST on PPO Charges (18%)</th>
      <th className="px-4 py-3 font-semibold text-right">GST on Additional Charges (18%)</th>
      <th className="px-4 py-3 font-semibold text-right">GST on Delivery Fee (18%)</th>
      <th className="px-4 py-3 font-semibold text-right">GST on Situational Charges (18%)</th>
      <th className="px-4 py-3 font-semibold text-right">Total GST Collected</th>
    </tr>
  );
  const bodyRows = gst.rows.map((r) => (
    <tr key={r.order_id} className="hover:bg-emerald-50/40 transition-colors">
      <td className="px-4 py-3 text-slate-500 tabular-nums">{r.sr_no}</td>
      <td className="px-4 py-3 font-mono text-slate-700">#{r.order_id}</td>
      <td className="px-4 py-3 text-slate-700">{r.order_date ?? "—"}</td>
      <td className="px-4 py-3 text-slate-800">{r.store ?? "—"}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.gst_on_food)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.gst_on_ppo)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.gst_on_additional)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.gst_on_delivery)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{inr(r.gst_on_situational)}</td>
      <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">{inr(r.total_gst)}</td>
    </tr>
  ));
  const searchTexts = gst.rows.map((r) => `#${r.order_id} ${r.store ?? ""} ${r.order_date ?? ""}`.toLowerCase());

  return (
    <>
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
      />

      <div className="relative px-8 pb-8 -mt-2 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">GST collected — order-wise details</h2>
            <p className="text-xs text-slate-500 mt-0.5">{gst.rows.length} order{gst.rows.length === 1 ? "" : "s"}.</p>
          </div>
          <CsvExportButton columns={csvColumns} rows={csvRows} filename="gst-report" />
        </div>
        <PaginatedTable
          headerRow={headerRow}
          bodyRows={bodyRows}
          searchTexts={searchTexts}
          searchable
          pageSize={15}
          colCount={10}
          empty="No GST data for this period."
        />
      </div>
    </>
  );
}
