import { adminFetch } from "../../../lib/api";
import { CreateForm } from "../../../components/CreateForm";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface Bonus {
  id: number;
  name: string;
  type: string;
  amount: number;
  trigger: string;
  threshold: number;
  period: string;
  status: boolean;
  claims_30d: number;
  created_at: string | null;
}

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "lifetime", label: "Lifetime (one-time)" },
];

const TYPE_OPTIONS = [
  { value: "bonus", label: "Bonus" },
  { value: "incentive", label: "Incentive" },
];

function periodLabel(p: string): string {
  return PERIOD_OPTIONS.find((o) => o.value === p)?.label ?? p;
}
function typeLabel(t: string): string {
  return TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "Bonus";
}
function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DmBonusesPage() {
  const data = await adminFetch<{ total: number; items: Bonus[] }>("/admin/dm-bonuses");
  const bonuses = data.items;
  const totalClaims = bonuses.reduce((s, b) => s + b.claims_30d, 0);
  const totalPayout = bonuses.reduce((s, b) => s + b.amount * b.claims_30d, 0);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> USER MANAGEMENT · DELIVERY MEN
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Bonuses &amp; Incentives</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
              <strong>One place to configure rider rewards.</strong> Make a rule like &ldquo;20 deliveries
              this week &rarr; ₹200&rdquo;, choose <strong>Bonus</strong> or <strong>Incentive</strong> and a
              <strong> Daily / Weekly / Monthly</strong> period. Riders get notified, and when one hits the
              target they raise a <strong>claim</strong> — it lands in <em>Reports → DM Withdrawal Request</em>;
              on your approval the reward is paid to their wallet and shows in <em>Reports → DM Disbursement</em>.
            </p>
          </div>
          <CreateForm
            path="/dm-bonuses"
            title="New reward"
            fields={[
              { name: "name", label: "Reward name", type: "text", required: true, placeholder: "20 orders → ₹200" },
              { name: "type", label: "Type", type: "select", options: TYPE_OPTIONS, defaultValue: "bonus" },
              { name: "threshold", label: "Deliveries needed", type: "number", required: true, defaultValue: 20 },
              { name: "period", label: "Within", type: "select", options: PERIOD_OPTIONS, defaultValue: "weekly" },
              { name: "amount", label: "Reward ₹", type: "number", required: true, defaultValue: 200 },
              { name: "trigger", label: "Note (optional)", type: "text", placeholder: "e.g. weekend push" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Active rules" value={bonuses.filter((b) => b.status).length.toString()} accent="emerald" />
        <StatTile label="Total claims (30d)" value={totalClaims.toString()} accent="blue" />
        <StatTile label="Total payout (30d)" value={`₹${totalPayout.toLocaleString("en-IN")}`} accent="amber" />
        <StatTile label="Avg per rider" value={bonuses.length ? `₹${Math.round(totalPayout / Math.max(1, totalClaims))}` : "—"} accent="slate" />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-900">All bonus rules</h2>
      </div>
      <PaginatedTable
        colCount={10}
        pageSize={10}
        searchable
        empty="No rewards configured."
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Rule</th>
            <th className="px-4 py-3 font-semibold text-right">Reward</th>
            <th className="px-4 py-3 font-semibold">Note</th>
            <th className="px-4 py-3 font-semibold text-right">Claims (30d)</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr>
        }
        searchTexts={bonuses.map((b) =>
          `#${b.id} ${b.name} ${b.trigger} ${periodLabel(b.period)} ${b.status ? "active" : "inactive"}`.toLowerCase()
        )}
        bodyRows={bonuses.map((b) => (
          <tr key={b.id} className="hover:bg-emerald-50/40">
            <td className="px-6 py-3 font-mono text-xs text-slate-400">#{b.id}</td>
            <td className="px-4 py-3 font-semibold text-slate-900">{b.name}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${b.type === "incentive" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{typeLabel(b.type)}</span>
            </td>
            <td className="px-4 py-3 text-xs text-slate-700">
              {b.threshold > 0 ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                  {b.threshold} deliveries · {periodLabel(b.period)}
                </span>
              ) : (
                <span className="text-amber-600">No threshold set</span>
              )}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">₹{b.amount}</td>
            <td className="px-4 py-3 text-slate-600 text-xs">{b.trigger}</td>
            <td className="px-4 py-3 text-right text-slate-700 tabular-nums">{b.claims_30d}</td>
            <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(b.created_at)}</td>
            <td className="px-4 py-3">
              {b.status ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">Inactive</span>
              )}
            </td>
            <td className="px-4 py-3 text-right">
              <span className="inline-flex gap-2">
                <EditRecordButton basePath="/dm-bonuses" id={b.id} title="Edit reward" values={b as unknown as Record<string, unknown>} fields={[
                  { name: "name", label: "Reward name" },
                  { name: "type", label: "Type", type: "select", options: TYPE_OPTIONS },
                  { name: "threshold", label: "Deliveries needed", type: "number" },
                  { name: "period", label: "Within", type: "select", options: PERIOD_OPTIONS },
                  { name: "amount", label: "Reward ₹", type: "number" },
                  { name: "trigger", label: "Note" },
                ]} />
                <ToggleStatusButton basePath="/dm-bonuses" id={b.id} currentStatus={b.status} />
                <DeleteButton basePath="/dm-bonuses" id={b.id} />
              </span>
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
