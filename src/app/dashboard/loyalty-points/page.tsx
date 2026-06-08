import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";

interface LP {
  id: number;
  user_id: number | null;
  user_name: string | null;
  transaction_id: string;
  credit: number;
  debit: number;
  balance: number;
  transaction_type: string | null;
  reference: string | null;
  reference_id: string | null;
  created_at: string | null;
}

export default async function LoyaltyPointsPage() {
  const data = await adminFetch<{ total: number; items: LP[] }>("/admin/loyalty-point-transactions?limit=200");

  // Debit / Credit / Balance summary, like StackFood's Customer Loyalty Point Report.
  const totalCredit = data.items.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const totalDebit = data.items.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const balance = totalCredit - totalDebit;

  return (
    <>
      <div className="px-8 pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Debit" value={totalDebit} accent="rose" />
        <SummaryCard label="Credit" value={totalCredit} accent="emerald" />
        <SummaryCard label="Balance" value={balance} accent="blue" />
      </div>
      <TablePage
        title="Customer loyalty point report"
        subtitle={`${data.items.length} of ${data.total} transactions`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "Tx", cell: (r) => <span className="font-mono text-xs">{r.transaction_id.slice(0, 8)}</span> },
          { header: "User", cell: (r) => r.user_name ?? (r.user_id ? `#${r.user_id}` : "—") },
          { header: "Type", cell: (r) => r.transaction_type ?? "—" },
          { header: "Credit", cell: (r) => <span className="text-emerald-600 font-semibold">{r.credit}</span> },
          { header: "Debit", cell: (r) => <span className="text-rose-600 font-semibold">{r.debit}</span> },
          { header: "Balance", cell: (r) => r.balance },
          { header: "Ref", cell: (r) => <span className="text-xs">{r.reference ?? ""}{r.reference_id ? ` #${r.reference_id}` : ""}</span> },
          { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
        ]}
      />
    </>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: "rose" | "emerald" | "blue" }) {
  const palette: Record<string, string> = {
    rose: "from-rose-50 to-white ring-rose-200 text-rose-700",
    emerald: "from-emerald-50 to-white ring-emerald-200 text-emerald-700",
    blue: "from-blue-50 to-white ring-blue-200 text-blue-700",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} rounded-2xl border border-slate-200 shadow-sm p-5 ring-1`}>
      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value.toLocaleString("en-IN")}<span className="text-sm font-normal text-slate-400 ml-1">pts</span></div>
    </div>
  );
}
