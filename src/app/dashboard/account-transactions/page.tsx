import { adminFetch } from "../../../lib/api";
import { TablePage, fmtMoney, fmtDate } from "../../../components/TablePage";

interface AccountTx {
  id: number;
  from_type: string | null;
  from_id: number | null;
  current_balance: number | null;
  amount: number;
  method: string | null;
  ref: string | null;
  type: string | null;
  created_by: string;
  created_at: string | null;
}

export default async function AccountTransactionsPage() {
  const data = await adminFetch<{ total: number; items: AccountTx[] }>("/admin/account-transactions?limit=200");
  return (
    <TablePage
      title="Account transactions"
      subtitle={`${data.items.length} of ${data.total}`}
      description="Review the full money-movement ledger across the platform — every credit, debit, balance and payment method, in one read-only record."
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "From", cell: (r) => (r.from_type ? `${r.from_type} #${r.from_id ?? 0}` : "—") },
        { header: "Amount", cell: (r) => fmtMoney(r.amount) },
        { header: "Balance", cell: (r) => (r.current_balance ? fmtMoney(r.current_balance) : "—") },
        { header: "Method", cell: (r) => r.method ?? "—" },
        { header: "Type", cell: (r) => <span className="text-xs uppercase">{r.type ?? "—"}</span> },
        { header: "Ref", cell: (r) => <span className="text-xs">{r.ref ?? "—"}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
