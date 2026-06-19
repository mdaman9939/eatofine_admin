import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { ReviewActions } from "./ReviewActions";
import { PaginatedTable } from "../../../components/PaginatedTable";

interface Penalty { target: string | null; amount: number }
interface PendingReview {
  id: number;
  order_id: number;
  scenario: string;
  scenario_label: string;
  cancelled_by: string;
  initiated_by: string;
  reason: string | null;
  order_amount: number;
  penalty: Penalty;
  created_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}

export default async function RefundReviewsPage() {
  const data = await adminFetch<{ total: number; items: PendingReview[] }>("/admin/refund-engine/pending").catch(
    () => ({ total: 0, items: [] as PendingReview[] }),
  );
  const items = data.items ?? [];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 text-white shadow-xl ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> Refund &amp; Cancellation · Penalty review
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Refund Reviews</h1>
          <p className="mt-2 text-sm text-white/85 leading-relaxed max-w-2xl">
            When a restaurant rejects an order, the customer is refunded immediately and the partner penalty is
            parked here for your review. <strong>Confirm</strong> to debit the at-fault partner&apos;s wallet, or
            <strong> Waive</strong> to let it go. Nothing is charged to a partner until you confirm.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatTile label="Pending reviews" value={items.length.toString()} />
        <StatTile label="Restaurant penalties" value={items.filter((i) => i.penalty.target === "restaurant").length.toString()} />
        <StatTile label="Deliveryman penalties" value={items.filter((i) => i.penalty.target === "deliveryman").length.toString()} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Pending penalty decisions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Auto-created on partner-initiated cancellations.</p>
        </div>
        <Link href="/dashboard/wallet-ledger" className="text-xs font-semibold text-rose-700 hover:underline">
          View wallet ledger →
        </Link>
      </div>
      <PaginatedTable
        colCount={7}
        pageSize={10}
        searchable
        empty="No pending reviews. Partner cancellations will appear here."
        headerRow={
          <tr>
            <th className="px-6 py-3 font-semibold">Order</th>
            <th className="px-4 py-3 font-semibold">Scenario</th>
            <th className="px-4 py-3 font-semibold">Reason</th>
            <th className="px-4 py-3 font-semibold text-right">Order ₹</th>
            <th className="px-4 py-3 font-semibold">Penalty</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3 font-semibold text-right">Action</th>
          </tr>
        }
        searchTexts={items.map((r) =>
          `#${r.order_id} ${r.scenario} ${r.scenario_label} ${r.reason ?? ""} ${r.initiated_by} ${r.penalty.target ?? ""}`.toLowerCase()
        )}
        bodyRows={items.map((r) => (
          <tr key={r.id} className="hover:bg-rose-50/40 align-top">
            <td className="px-6 py-3">
              <Link href={`/dashboard/orders/${r.order_id}`} className="font-mono text-sm font-semibold text-rose-700 hover:underline">#{r.order_id}</Link>
              <div className="text-[10px] text-slate-400 mt-0.5">by {r.initiated_by}</div>
            </td>
            <td className="px-4 py-3">
              <div className="text-slate-800 text-xs font-medium max-w-[260px]">{r.scenario_label}</div>
            </td>
            <td className="px-4 py-3 text-slate-600 text-xs">{r.reason ?? "—"}</td>
            <td className="px-4 py-3 text-right tabular-nums text-slate-700">₹{r.order_amount.toFixed(2)}</td>
            <td className="px-4 py-3">
              {r.penalty.target ? (
                <span className="inline-flex flex-col">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-0.5 capitalize w-fit">
                    {r.penalty.target}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">debit ₹{r.penalty.amount.toFixed(2)}</span>
                </span>
              ) : <span className="text-slate-300">—</span>}
            </td>
            <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.created_at)}</td>
            <td className="px-4 py-3 text-right"><ReviewActions decisionId={r.id} /></td>
          </tr>
        ))}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gradient-to-b from-rose-50/60 to-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
