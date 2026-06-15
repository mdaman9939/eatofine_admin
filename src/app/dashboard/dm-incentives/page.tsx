import { adminFetch } from "../../../lib/api";
import { ApproveRejectButtons } from "../../../components/ApproveRejectButtons";
import { BonusIncentiveConfigPanel } from "../../../components/BonusIncentiveConfigPanel";

interface Incentive {
  id: number;
  dm_id: number | null;
  dm_name: string;
  period: string;
  deliveries: number;
  claim_amount: number;
  status: string;
  reason: string | null;
  created_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default async function DmIncentivesPage() {
  const data = await adminFetch<{ total: number; items: Incentive[] }>("/admin/dm-incentives");
  const rows = data.items;
  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");
  const rejected = rows.filter((r) => r.status === "rejected");
  const totalApproved = approved.reduce((s, r) => s + r.claim_amount, 0);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> USER MANAGEMENT · DELIVERY MEN
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery Man Incentives</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Performance-linked incentive claims. Approve to credit the rider&apos;s wallet, reject with a reason.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Pending review" value={pending.length.toString()} accent="amber" />
        <StatTile label="Approved (30d)" value={approved.length.toString()} accent="emerald" />
        <StatTile label="Rejected (30d)" value={rejected.length.toString()} accent="rose" />
        <StatTile label="Total paid" value={`₹${totalApproved.toLocaleString("en-IN")}`} accent="blue" />
      </div>

      {/* Bonus & incentive rules configuration */}
      <BonusIncentiveConfigPanel />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">All incentive claims</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Rider</th>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold text-right">Deliveries</th>
                <th className="px-4 py-3 font-semibold text-right">Claim</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No incentive claims yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{r.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{r.dm_name}</td>
                  <td className="px-4 py-3 text-slate-700 text-xs">{r.period}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.deliveries}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{r.claim_amount}</td>
                  <td className="px-4 py-3">
                    {r.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending
                      </span>
                    )}
                    {r.status === "approved" && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved
                      </span>
                    )}
                    {r.status === "rejected" && (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Rejected
                        </span>
                        {r.reason && <div className="text-[10px] text-slate-500 mt-1 italic">{r.reason}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" && <ApproveRejectButtons basePath="dm-incentives" id={r.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "amber" | "emerald" | "rose" | "blue" }) {
  const palette: Record<string, string> = {
    amber: "from-amber-50/60 ring-amber-200",
    emerald: "from-emerald-50/60 ring-emerald-200",
    rose: "from-rose-50/60 ring-rose-200",
    blue: "from-blue-50/60 ring-blue-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
