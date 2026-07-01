import { adminFetch } from "../../../lib/api";
import { PaginatedTable } from "../../../components/PaginatedTable";

/**
 * Wallet ledger — cross-order audit of every restaurant/DM wallet movement
 * produced by the refund engine. Lets ops reconcile what was penalised vs
 * credited per scenario before settlement runs.
 */

interface LedgerEntry {
  mysql_id: number;
  actor_type: "restaurant" | "deliveryman";
  actor_id: number | null;
  order_id: number;
  direction: "credit" | "debit";
  amount: number;
  note: string;
  scenario: string;
  created_at: string;
}

export default async function WalletLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ actor_type?: string }>;
}) {
  const { actor_type } = await searchParams;
  const qs = actor_type ? `?actor_type=${encodeURIComponent(actor_type)}` : "";
  const data = await adminFetch<{ total: number; items: LedgerEntry[] }>(
    `/admin/refund-engine/ledger${qs}`,
  ).catch(() => ({ total: 0, items: [] as LedgerEntry[] }));

  const credits = data.items.filter((e) => e.direction === "credit").reduce((s, e) => s + Number(e.amount), 0);
  const debits = data.items.filter((e) => e.direction === "debit").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · WALLET LEDGER
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Wallet ledger</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Every restaurant + delivery-man wallet movement triggered by a refund / cancellation scenario. Cross-reference penalties against credits before payouts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Entries" value={data.total} accent="blue" />
        <StatCard label="Credits" value={`₹${Math.round(credits).toLocaleString("en-IN")}`} accent="emerald" />
        <StatCard label="Debits" value={`₹${Math.round(debits).toLocaleString("en-IN")}`} accent="rose" />
      </div>

      <div className="flex gap-2">
        <FilterChip href="/dashboard/wallet-ledger" active={!actor_type}>All</FilterChip>
        <FilterChip href="/dashboard/wallet-ledger?actor_type=restaurant" active={actor_type === "restaurant"}>Restaurant</FilterChip>
        <FilterChip href="/dashboard/wallet-ledger?actor_type=deliveryman" active={actor_type === "deliveryman"}>Deliveryman</FilterChip>
      </div>

      <div className="space-y-3">
        <PaginatedTable
          searchable
          pageSize={15}
          colCount={8}
          searchTexts={data.items.map((e) => `#${e.mysql_id} ${e.actor_type} ${e.actor_id ?? ""} #${e.order_id} ${e.direction} ${e.scenario} ${e.note}`.toLowerCase())}
          empty="No ledger entries yet. They appear once a refund/cancellation scenario is applied to an order."
          headerRow={
            <tr>
              <th className="px-6 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Direction</th>
              <th className="px-4 py-3 font-semibold text-right">Amount</th>
              <th className="px-4 py-3 font-semibold">Scenario</th>
              <th className="px-4 py-3 font-semibold">Note</th>
              <th className="px-4 py-3 font-semibold">When</th>
            </tr>
          }
          bodyRows={data.items.map((e) => (
                <tr key={e.mysql_id} className="hover:bg-emerald-50/40">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{e.mysql_id}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ring-1 ${e.actor_type === "restaurant" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-cyan-50 text-cyan-700 ring-cyan-200"}`}>
                      {e.actor_type}#{e.actor_id ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-emerald-700">
                    <a href={`/dashboard/orders/${e.order_id}`} className="hover:underline">#{e.order_id}</a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${e.direction === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {e.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">₹{Number(e.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-700">{e.scenario}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{e.note}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {e.created_at ? new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </td>
                </tr>
              ))}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: "blue" | "emerald" | "rose" }) {
  const palette = {
    blue: "from-blue-50/60 to-white text-blue-700",
    emerald: "from-emerald-50/60 to-white text-emerald-700",
    rose: "from-rose-50/60 to-white text-rose-700",
  }[accent];
  return (
    <div className={`bg-gradient-to-b ${palette.split(" text-")[0]} rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full ring-1 transition ${active ? "bg-emerald-600 text-white ring-emerald-700" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"}`}
    >
      {children}
    </a>
  );
}
