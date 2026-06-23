import { adminFetch } from "../../../lib/api";
import { ApproveRejectButtons } from "../../../components/ApproveRejectButtons";
import { BonusIncentiveConfigPanel } from "../../../components/BonusIncentiveConfigPanel";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { CreateForm } from "../../../components/CreateForm";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { DeleteButton } from "../../../components/ActionButton";

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
  const [data, dmRes] = await Promise.all([
    adminFetch<{ total: number; items: Incentive[] }>("/admin/dm-incentives"),
    adminFetch<{ delivery_men: Array<{ id: number; f_name: string | null; l_name: string | null }> }>(
      "/admin/delivery-men?limit=500",
    ).catch(() => ({ delivery_men: [] as Array<{ id: number; f_name: string | null; l_name: string | null }> })),
  ]);
  const rows = data.items;
  const dmOptions = dmRes.delivery_men.map((d) => ({
    value: String(d.id),
    label: `${`${d.f_name ?? ""} ${d.l_name ?? ""}`.trim() || `DM #${d.id}`} (#${d.id})`,
  }));
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
            <strong>How it works — Manual reward, you approve each one.</strong> A claim is raised for a
            rider&apos;s performance (period, deliveries, amount) and stays <em>Pending</em> until you act:
            <strong> Approve</strong> credits the amount to their wallet, <strong>Reject</strong> declines it
            with a reason. Use for discretionary / case-by-case payouts.
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">All incentive claims</h2>
          <p className="text-xs text-slate-500 mt-0.5">Raise a claim for a rider, then Approve to credit their wallet or Reject with a reason.</p>
        </div>
        <CreateForm
          path="/dm-incentives"
          title="New incentive claim"
          submitLabel="Create claim"
          fields={[
            { name: "dm_id", label: "Delivery man", type: "select", required: true, options: dmOptions },
            { name: "period", label: "Period", type: "text", placeholder: "e.g. Jun 2026 / Week 24" },
            { name: "deliveries", label: "Deliveries in period", type: "number", placeholder: "e.g. 120" },
            { name: "claim_amount", label: "Claim amount ₹", type: "number", required: true, placeholder: "e.g. 500" },
          ]}
        />
      </div>
      <PaginatedTable
        colCount={8}
        pageSize={10}
        searchable
        empty="No incentive claims yet."
        headerRow={
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
        }
        searchTexts={rows.map((r) =>
          `#${r.id} ${r.dm_name} ${r.period} ${r.status} ${r.reason ?? ""}`.toLowerCase()
        )}
        bodyRows={rows.map((r) => (
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
              <span className="inline-flex items-center gap-2 justify-end flex-wrap">
                {r.status === "pending" && (
                  <>
                    <ApproveRejectButtons basePath="dm-incentives" id={r.id} />
                    <EditRecordButton
                      basePath="/dm-incentives"
                      id={r.id}
                      title="Edit claim"
                      values={r as unknown as Record<string, unknown>}
                      fields={[
                        { name: "period", label: "Period" },
                        { name: "deliveries", label: "Deliveries", type: "number" },
                        { name: "claim_amount", label: "Claim amount ₹", type: "number" },
                      ]}
                    />
                  </>
                )}
                {/* Approved claims are locked (already credited the wallet); only pending/rejected can be removed. */}
                {r.status !== "approved" && <DeleteButton basePath="/dm-incentives" id={r.id} />}
              </span>
            </td>
          </tr>
        ))}
      />
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
