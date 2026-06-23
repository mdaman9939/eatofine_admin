import { adminFetch } from "../../../lib/api";
import { AddFundForm } from "./AddFundForm";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface HistoryRow {
  id: number;
  user_id: number | null;
  customer_name: string;
  amount: number;
  reason: string;
  created_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

export default async function CustomerWalletFundPage() {
  const data = await adminFetch<{ total: number; items: HistoryRow[] }>("/admin/customer-wallet/add-fund/history?limit=200");
  const rows = data.items;

  const last30d = rows.filter((r) => {
    if (!r.created_at) return false;
    return Date.now() - new Date(r.created_at).getTime() < 30 * 86_400_000;
  });
  const last30dTotal = last30d.reduce((s, r) => s + r.amount, 0);
  const uniqueCustomers = new Set(last30d.map((r) => r.user_id).filter(Boolean)).size;
  const avg = last30d.length ? last30dTotal / last30d.length : 0;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> USER MANAGEMENT · WALLET
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add Fund to Customer Wallet</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Manually add money to a customer&apos;s wallet for refunds, compensation or promotions — every credit is recorded below for your records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total added (30d)" value={`₹${last30dTotal.toFixed(0)}`} accent="emerald" />
        <StatTile label="Customers credited" value={uniqueCustomers.toString()} hint="Unique recipients" accent="blue" />
        <StatTile label="Average credit" value={`₹${avg.toFixed(0)}`} accent="amber" />
        <StatTile label="Total transactions" value={rows.length.toString()} accent="slate" />
      </div>

      {/* Form */}
      <AddFundForm />

      {/* History */}
      <div>
        <h2 className="text-base font-semibold text-slate-900">Recent credits</h2>
        <p className="text-xs text-slate-500 mt-0.5">Last {rows.length} admin-initiated wallet credits.</p>
      </div>
      <PaginatedTable
        colCount={5}
        pageSize={10}
        searchable
        empty="No credits yet"
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold text-right">Amount</th>
            <th className="px-4 py-3 font-semibold">Reason</th>
            <th className="px-4 py-3 font-semibold">Date</th>
          </tr>
        }
        searchTexts={rows.map((r) => `#${r.id} ${r.customer_name} ${r.reason}`.toLowerCase())}
        bodyRows={rows.map((r) => (
          <tr key={r.id} className="hover:bg-emerald-50/40">
            <td className="px-6 py-3 font-mono text-xs text-slate-400">#{r.id}</td>
            <td className="px-4 py-3 font-medium text-slate-900">{r.customer_name}</td>
            <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">+ ₹{r.amount.toFixed(2)}</td>
            <td className="px-4 py-3 text-slate-600 text-xs max-w-xs truncate">{r.reason}</td>
            <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.created_at)}</td>
          </tr>
        ))}
      />
    </div>
  );
}

function StatTile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: "emerald" | "blue" | "amber" | "slate" }) {
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
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
