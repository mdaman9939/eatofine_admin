import { adminFetch } from "../../../../lib/api";
import { ReportTemplate } from "../../../../components/ReportTemplate";
import { ReportFilterBar } from "../../../../components/ReportFilterBar";
import { reportQuery, reportFilterOptions } from "../../../../lib/reportFilters";
import { PaginatedTable } from "../../../../components/PaginatedTable";
import { fmtMoney, fmtDate } from "../../../../components/TablePage";

interface TopDM {
  top_delivery_men: Array<{
    delivery_man_id: number | null;
    name: string | null;
    phone: string | null;
    zone_id: number | null;
    deliveries: number;
    total_tips: number;
    total_delivery_charges: number;
    total_incentive?: number;
    total_bonus?: number;
  }>;
}

// Live wallet-credit ledger row (formerly the standalone "DM Earnings" page).
interface LedgerRow {
  id: number;
  delivery_man_id: number | null;
  dm_name: string | null;
  amount: number;
  method: string | null;
  ref: string | null;
  created_at: string | null;
}

const CHANNEL: Record<string, { label: string; tone: string }> = {
  delivery: { label: "Delivery fee", tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  tip: { label: "Tip", tone: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  bonus: { label: "Bonus", tone: "bg-amber-50 text-amber-700 border-amber-200" },
};

function inr(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

export default async function DeliverymanEarningReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const qs = reportQuery(sp);
  qs.set("limit", "50");
  const [data, { zones, restaurants }, ledger] = await Promise.all([
    adminFetch<TopDM>(`/admin/reports/top-deliverymen?${qs.toString()}`),
    reportFilterOptions(),
    // The live rider wallet ledger (delivery fees + tips + bonuses actually
    // credited). Folded into this report so it lives in one place. Tolerate a
    // failure so the main report still renders.
    adminFetch<{ total: number; items: LedgerRow[] }>("/admin/dm-earnings?limit=200").catch(() => ({ total: 0, items: [] as LedgerRow[] })),
  ]);
  const totalCharges = data.top_delivery_men.reduce((s, r) => s + r.total_delivery_charges, 0);
  const totalTips = data.top_delivery_men.reduce((s, r) => s + r.total_tips, 0);
  const totalIncentive = data.top_delivery_men.reduce((s, r) => s + (r.total_incentive ?? 0), 0);
  const totalBonus = data.top_delivery_men.reduce((s, r) => s + (r.total_bonus ?? 0), 0);
  const grandTotal = totalCharges + totalTips + totalIncentive + totalBonus;

  // ── Wallet ledger table (search + pagination via PaginatedTable) ──────────
  const ledgerHeader = (
    <tr>
      <th className="px-4 py-3 font-semibold">#</th>
      <th className="px-4 py-3 font-semibold">Delivery man</th>
      <th className="px-4 py-3 font-semibold text-right">Amount</th>
      <th className="px-4 py-3 font-semibold">Channel</th>
      <th className="px-4 py-3 font-semibold">Ref</th>
      <th className="px-4 py-3 font-semibold">When</th>
    </tr>
  );
  const ledgerRows = ledger.items.map((r) => {
    const c = CHANNEL[r.method ?? ""] ?? { label: r.method ?? "—", tone: "bg-slate-100 text-slate-600 border-slate-200" };
    return (
      <tr key={r.id} className="hover:bg-emerald-50/40 transition-colors">
        <td className="px-4 py-3 font-mono text-slate-700">{r.id}</td>
        <td className="px-4 py-3 text-slate-800">{r.dm_name ?? (r.delivery_man_id ? `#${r.delivery_man_id}` : "—")}</td>
        <td className="px-4 py-3 text-right"><span className="font-semibold text-emerald-700 tabular-nums">+ {fmtMoney(r.amount)}</span></td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${c.tone}`}>{c.label}</span>
        </td>
        <td className="px-4 py-3 text-xs text-slate-500">{r.ref ?? ""}</td>
        <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(r.created_at)}</td>
      </tr>
    );
  });
  const ledgerSearch = ledger.items.map((r) =>
    `${r.dm_name ?? ""} #${r.delivery_man_id ?? ""} ${r.method ?? ""} ${r.ref ?? ""}`.toLowerCase(),
  );

  return (
    <>
      <ReportTemplate
        badge="SYSTEM · REPORTS"
        title="Deliveryman Earning Report"
        description="Per-rider earnings breakdown — deliveries completed, delivery charges earned, customer tips. Filter by date range, zone or restaurant."
        filterBar={<ReportFilterBar zones={zones} restaurants={restaurants} showZone showRestaurant />}
        stats={[
          { label: "Active riders", value: data.top_delivery_men.length.toString(), accent: "blue" },
          { label: "Total delivery fees", value: inr(totalCharges), accent: "emerald" },
          { label: "Bonus + Incentive", value: inr(totalBonus + totalIncentive), accent: "amber" },
          { label: "Total earned", value: inr(grandTotal), accent: "slate" },
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
          { key: "bonus", label: "Bonus", align: "right" },
          { key: "incentive", label: "Incentive", align: "right" },
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
          bonus: inr(r.total_bonus ?? 0),
          incentive: inr(r.total_incentive ?? 0),
          total: inr(r.total_delivery_charges + r.total_tips + (r.total_bonus ?? 0) + (r.total_incentive ?? 0)),
        }))}
      />

      {/* ── Live wallet-credit ledger (merged in from the old "DM Earnings" page) ── */}
      <div className="relative px-8 pb-8 -mt-2 space-y-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Earnings ledger — live wallet credits</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {ledger.items.length} of {ledger.total} · every delivery fee, tip and bonus actually credited to riders&apos; wallets.
          </p>
        </div>
        <PaginatedTable
          headerRow={ledgerHeader}
          bodyRows={ledgerRows}
          searchTexts={ledgerSearch}
          searchable
          pageSize={10}
          colCount={6}
          empty="No wallet credits yet."
        />
      </div>
    </>
  );
}
