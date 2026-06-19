import { adminFetch } from "../../../lib/api";
import { CreateForm } from "../../../components/CreateForm";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";

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
  { value: "daily", label: "Per day" },
  { value: "weekly", label: "Per week" },
  { value: "lifetime", label: "Lifetime (one-time)" },
];

function periodLabel(p: string): string {
  return PERIOD_OPTIONS.find((o) => o.value === p)?.label ?? p;
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
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery Man Bonuses</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Reward riders for completing deliveries. A rule auto-credits the rider&apos;s wallet once they
              reach <strong>N delivered orders</strong> within the chosen period — once per rider per period.
            </p>
          </div>
          <CreateForm
            path="/dm-bonuses"
            title="New bonus"
            fields={[
              { name: "name", label: "Bonus name", type: "text", required: true, placeholder: "20 orders → ₹200" },
              { name: "threshold", label: "Deliveries needed", type: "number", required: true, defaultValue: 20 },
              { name: "period", label: "Within", type: "select", options: PERIOD_OPTIONS, defaultValue: "daily" },
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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">All bonus rules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Bonus</th>
                <th className="px-4 py-3 font-semibold">Rule</th>
                <th className="px-4 py-3 font-semibold text-right">Reward</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3 font-semibold text-right">Claims (30d)</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bonuses.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">No bonuses configured.</td></tr>
              ) : bonuses.map((b) => (
                <tr key={b.id} className="hover:bg-emerald-50/40">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{b.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{b.name}</td>
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
                      <EditRecordButton basePath="/dm-bonuses" id={b.id} title="Edit bonus" values={b as unknown as Record<string, unknown>} fields={[
                        { name: "name", label: "Bonus name" },
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
            </tbody>
          </table>
        </div>
      </div>
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
