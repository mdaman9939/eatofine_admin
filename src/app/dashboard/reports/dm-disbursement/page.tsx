import { adminFetch } from "../../../../lib/api";
import { PaginatedTable } from "../../../../components/PaginatedTable";
import { CsvExportButton } from "../../../../components/CsvExportButton";

interface Row {
  kind: string;       // 'bonus' | 'incentive' | 'tip'
  dm_id: number;
  dm_name: string | null;
  amount: number;
  reference: string | null;
  order_id: number | null;
  at: string | null;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

const KIND_PILL: Record<string, { tone: string; label: string }> = {
  bonus: { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Bonus" },
  incentive: { tone: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Incentive" },
  tip: { tone: "bg-amber-50 text-amber-700 border-amber-200", label: "Customer Tip" },
};

export default async function DmDisbursementReportPage() {
  const data = await adminFetch<{ total: number; items: Row[] }>("/admin/dm-disbursement-report")
    .catch(() => ({ total: 0, items: [] as Row[] }));
  const rows = data.items;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const tipTotal = rows.filter((r) => r.kind === "tip").reduce((s, r) => s + r.amount, 0);
  const rewardTotal = total - tipTotal;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> REPORTS · DELIVERY MEN
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">DM Disbursement</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-3xl">
            Every amount that reached a rider&apos;s wallet — <strong>approved Bonus / Incentive rewards</strong>
            and <strong>customer Tips</strong> — each with the exact time it was credited. Tips flow
            automatically (no setup); rewards arrive when you approve a claim.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total disbursed" value={`₹${total.toLocaleString("en-IN")}`} accent="emerald" />
        <StatTile label="Rewards (bonus + incentive)" value={`₹${rewardTotal.toLocaleString("en-IN")}`} accent="blue" />
        <StatTile label="Customer tips" value={`₹${tipTotal.toLocaleString("en-IN")}`} accent="amber" />
        <StatTile label="Entries" value={rows.length.toString()} accent="slate" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-slate-900">Disbursement log</h2>
        <CsvExportButton
          filename="dm-disbursement"
          columns={[
            { key: "rider", label: "Rider" },
            { key: "dm_id", label: "Rider ID" },
            { key: "type", label: "Type" },
            { key: "reference", label: "Reference" },
            { key: "order", label: "Order" },
            { key: "amount", label: "Amount" },
            { key: "credited_at", label: "Credited At" },
          ]}
          rows={rows.map((r) => ({
            rider: r.dm_name ?? `Rider #${r.dm_id}`,
            dm_id: r.dm_id,
            type: KIND_PILL[r.kind]?.label ?? r.kind,
            reference: r.reference ?? "",
            order: r.order_id ? `#${r.order_id}` : "",
            amount: r.amount.toFixed(2),
            credited_at: fmtDate(r.at),
          }))}
        />
      </div>
      <PaginatedTable
        colCount={6}
        pageSize={12}
        searchable
        empty="No disbursements yet."
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">Rider</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Reference</th>
            <th className="px-4 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
            <th className="px-4 py-3 font-semibold">Credited at</th>
          </tr>
        }
        searchTexts={rows.map((r) =>
          `${r.dm_name ?? ""} ${KIND_PILL[r.kind]?.label ?? r.kind} ${r.reference ?? ""} ${r.order_id ?? ""}`.toLowerCase()
        )}
        bodyRows={rows.map((r, i) => {
          const k = KIND_PILL[r.kind] ?? { tone: "bg-slate-100 text-slate-600 border-slate-200", label: r.kind };
          return (
            <tr key={i} className="hover:bg-emerald-50/40">
              <td className="px-6 py-3">
                <div className="text-sm font-medium text-slate-800">{r.dm_name ?? `Rider #${r.dm_id}`}</div>
                <div className="text-[10px] font-mono text-slate-400">#{r.dm_id}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${k.tone}`}>{k.label}</span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">{r.reference ?? "—"}</td>
              <td className="px-4 py-3 text-xs font-mono text-slate-500">{r.order_id ? `#${r.order_id}` : "—"}</td>
              <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">₹{r.amount.toFixed(2)}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(r.at)}</td>
            </tr>
          );
        })}
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
