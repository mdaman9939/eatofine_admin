import { adminFetch } from "../../../../lib/api";
import { IncentivesHistoryTable, type IncentiveHistoryRow } from "../../../../components/IncentivesHistoryTable";

export default async function IncentivesHistoryPage() {
  const data = await adminFetch<{ total: number; items: IncentiveHistoryRow[] }>("/admin/dm-incentives").catch(
    () => ({ total: 0, items: [] as IncentiveHistoryRow[] }),
  );
  const rows = data.items;
  const approved = rows.filter((r) => r.status === "approved");
  const totalIncentive = approved.reduce((s, r) => s + r.claim_amount, 0);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> USER MANAGEMENT · DELIVERY MEN
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Incentives History</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Full history of rider incentives — every claim with its rider, zone, total earning, incentive amount and decision status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total records" value={rows.length.toString()} accent="blue" />
        <StatTile label="Approved" value={approved.length.toString()} accent="emerald" />
        <StatTile label="Pending" value={rows.filter((r) => r.status === "pending").length.toString()} accent="amber" />
        <StatTile label="Total incentive paid" value={`₹${totalIncentive.toLocaleString("en-IN")}`} accent="slate" />
      </div>

      <IncentivesHistoryTable rows={rows} />
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "amber" | "emerald" | "blue" | "slate" }) {
  const palette: Record<string, string> = {
    amber: "from-amber-50/60 ring-amber-200",
    emerald: "from-emerald-50/60 ring-emerald-200",
    blue: "from-blue-50/60 ring-blue-200",
    slate: "from-slate-50/60 ring-slate-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
