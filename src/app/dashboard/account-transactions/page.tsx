import { adminFetch } from "../../../lib/api";
import { TablePage, fmtMoney, fmtDate } from "../../../components/TablePage";

interface AccountTx {
  id: number;
  from_type: string;
  from_id: number;
  current_balance: number;
  amount: number;
  method: string;
  ref: string | null;
  type: string;
  created_by: string;
  created_at: string | null;
}

export default async function AccountTransactionsPage() {
  const data = await adminFetch<{ total: number; items: AccountTx[] }>("/admin/account-transactions?limit=200");
  return (
    <TablePage
      title="Account transactions"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "From", cell: (r) => `${r.from_type} #${r.from_id}` },
        { header: "Amount", cell: (r) => fmtMoney(r.amount) },
        { header: "Balance", cell: (r) => fmtMoney(r.current_balance) },
        { header: "Method", cell: (r) => r.method },
        { header: "Type", cell: (r) => <span className="text-xs uppercase">{r.type}</span> },
        { header: "Ref", cell: (r) => <span className="text-xs">{r.ref ?? "—"}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
