import { adminFetch } from "../../../../lib/api";
import { PaginatedTable } from "../../../../components/PaginatedTable";
import { ApproveRejectButtons } from "../../../../components/ApproveRejectButtons";

interface Claim {
  id: number;
  dm_id: number;
  dm_name: string | null;
  bonus_id: number;
  bonus_name: string | null;
  type: string;
  period: string | null;
  threshold: number;
  deliveries: number;
  amount: number;
  status: string;
  reason: string | null;
  requested_at: string | null;
  decided_at: string | null;
  credited_at: string | null;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

export default async function DmWithdrawalRequestsPage() {
  const data = await adminFetch<{ total: number; items: Claim[] }>("/admin/dm-reward-claims")
    .catch(() => ({ total: 0, items: [] as Claim[] }));
  const claims = data.items;
  const pending = claims.filter((c) => c.status === "pending");
  const approved = claims.filter((c) => c.status === "approved");
  const pendingValue = pending.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> REPORTS · DELIVERY MEN
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery Men Withdrawal Request</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-3xl">
            When a rider hits a configured Bonus / Incentive target, they raise a claim here. Review it —
            <strong> Approve</strong> credits the reward to the rider&apos;s wallet (it then shows in
            <em> DM Disbursement</em>), <strong>Reject</strong> declines it. No money moves until you approve.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Pending claims" value={pending.length.toString()} accent="amber" />
        <StatTile label="Pending value" value={`₹${pendingValue.toLocaleString("en-IN")}`} accent="blue" />
        <StatTile label="Approved" value={approved.length.toString()} accent="emerald" />
        <StatTile label="Total claims" value={claims.length.toString()} accent="slate" />
      </div>

      <h2 className="text-base font-semibold text-slate-900">All claims</h2>
      <PaginatedTable
        colCount={8}
        pageSize={10}
        searchable
        empty="No reward claims yet."
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Rider</th>
            <th className="px-4 py-3 font-semibold">Reward</th>
            <th className="px-4 py-3 font-semibold">Achieved</th>
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Requested</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        }
        searchTexts={claims.map((c) =>
          `#${c.id} ${c.dm_name ?? ""} ${c.bonus_name ?? ""} ${c.type} ${c.status}`.toLowerCase()
        )}
        bodyRows={claims.map((c) => (
          <tr key={c.id} className="hover:bg-emerald-50/40 align-top">
            <td className="px-6 py-3 font-mono text-xs text-slate-400">#{c.id}</td>
            <td className="px-4 py-3">
              <div className="text-sm font-medium text-slate-800">{c.dm_name ?? `Rider #${c.dm_id}`}</div>
              <div className="text-[10px] font-mono text-slate-400">#{c.dm_id}</div>
            </td>
            <td className="px-4 py-3">
              <div className="text-sm text-slate-800">{c.bonus_name ?? "—"}</div>
              <span className={`mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.type === "incentive" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                {c.type === "incentive" ? "Incentive" : "Bonus"}{c.period ? ` · ${c.period}` : ""}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-slate-700 tabular-nums">
              {c.deliveries}/{c.threshold} <span className="text-[10px] text-slate-400">deliveries</span>
            </td>
            <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">₹{c.amount.toFixed(2)}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border ${STATUS_PILL[c.status] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                {c.status}
              </span>
              {c.status === "rejected" && c.reason && <div className="text-[10px] text-rose-500 italic mt-0.5 max-w-[12rem]">{c.reason}</div>}
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(c.requested_at)}</td>
            <td className="px-4 py-3 text-right">
              {c.status === "pending" ? (
                <ApproveRejectButtons basePath="dm-reward-claims" id={c.id} />
              ) : (
                <span className="text-[11px] text-slate-300">
                  {c.status === "approved" ? `paid ${fmtDate(c.credited_at)}` : "—"}
                </span>
              )}
            </td>
          </tr>
        ))}
      />
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "emerald" | "blue" | "amber" | "slate" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    blue: "from-blue-50/60 ring-blue-200",
    amber: "from-amber-50/60 ring-amber-200",
    slate: "from-slate-50/60 ring-slate-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
