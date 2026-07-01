import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { CashDepositButton } from "../../../components/CashDepositButton";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface Payout {
  dm_id: number;
  dm_name: string;
  phone: string | null;
  balance: number;
  total_earning: number;
  collected_cash: number;
  pending_withdraw: number;
  total_withdrawn: number;
  available_to_withdraw: number;
  net_position: number;
}

const inr = (n: number) => `₹${(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function DmPayoutsPage() {
  const data = await adminFetch<{ total: number; items: Payout[] }>("/admin/dm-payouts").catch(
    () => ({ total: 0, items: [] as Payout[] }),
  );
  const items = data.items ?? [];

  const totalPayable = items.reduce((s, p) => s + Math.max(0, p.available_to_withdraw), 0);
  const totalCod = items.reduce((s, p) => s + p.collected_cash, 0);
  const owingRiders = items.filter((p) => p.net_position < 0).length;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> DISBURSEMENT &amp; PAYOUT · RIDERS
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Delivery Man Payouts</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Net position per rider — earnings (delivery + tips + bonus + incentive, already net of penalties)
              minus the COD cash they still hold. <strong>Available</strong> is what they can withdraw now;
              a negative <strong>net</strong> means the rider owes the platform.
            </p>
          </div>
          <Link href="/dashboard/withdraw-requests" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-white/95 ring-1 ring-white/30 px-3 py-2 rounded-lg hover:bg-white">
            Withdrawal requests →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatTile label="Total payable now" value={inr(totalPayable)} accent="emerald" />
        <StatTile label="COD cash held by riders" value={inr(totalCod)} accent="amber" hint="awaiting deposit" />
        <StatTile label="Riders owing platform" value={owingRiders.toString()} accent="rose" hint="net position < 0" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-slate-900">Per-rider reconciliation</h2>
          <p className="text-xs text-slate-500 mt-0.5">{items.length} riders with a wallet.</p>
        </div>
        <PaginatedTable
          searchable
          pageSize={15}
          colCount={7}
          searchTexts={items.map((p) => `#${p.dm_id} ${p.dm_name} ${p.phone ?? ""}`.toLowerCase())}
          empty="No rider wallets yet."
          headerRow={
            <tr>
              <th className="px-6 py-3 font-semibold">Rider</th>
              <th className="px-4 py-3 font-semibold text-right">Earnings (balance)</th>
              <th className="px-4 py-3 font-semibold text-right">COD held</th>
              <th className="px-4 py-3 font-semibold text-right">Pending</th>
              <th className="px-4 py-3 font-semibold text-right">Available</th>
              <th className="px-4 py-3 font-semibold text-right">Net position</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          }
          bodyRows={items.map((p) => (
                <tr key={p.dm_id} className="hover:bg-emerald-50/40">
                  <td className="px-6 py-3">
                    <div className="font-semibold text-slate-900">{p.dm_name}</div>
                    <div className="text-[10px] text-slate-400">#{p.dm_id}{p.phone ? ` · ${p.phone}` : ""}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-800">{inr(p.balance)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {p.collected_cash > 0 ? <span className="text-amber-700 font-semibold">{inr(p.collected_cash)}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{p.pending_withdraw > 0 ? inr(p.pending_withdraw) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-emerald-700">{inr(p.available_to_withdraw)}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    <span className={p.net_position < 0 ? "text-rose-600" : "text-slate-900"}>{inr(p.net_position)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CashDepositButton dmId={p.dm_id} collectedCash={p.collected_cash} />
                  </td>
                </tr>
              ))}
        />
      </div>
    </div>
  );
}

function StatTile({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent: "emerald" | "amber" | "rose" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    amber: "from-amber-50/60 ring-amber-200",
    rose: "from-rose-50/60 ring-rose-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
