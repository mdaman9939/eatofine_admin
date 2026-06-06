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
  return (
    <TablePage
      title="Loyalty points"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "Tx", cell: (r) => <span className="font-mono text-xs">{r.transaction_id.slice(0, 8)}</span> },
        { header: "User", cell: (r) => r.user_name ?? (r.user_id ? `#${r.user_id}` : "—") },
        { header: "Type", cell: (r) => r.transaction_type ?? "—" },
        { header: "Credit", cell: (r) => r.credit },
        { header: "Debit", cell: (r) => r.debit },
        { header: "Balance", cell: (r) => r.balance },
        { header: "Ref", cell: (r) => <span className="text-xs">{r.reference ?? ""}{r.reference_id ? ` #${r.reference_id}` : ""}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
