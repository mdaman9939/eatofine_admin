import { adminFetch } from "../../../lib/api";
import { TablePage, fmtMoney, fmtDate } from "../../../components/TablePage";

interface WalletTx {
  id: number;
  user_id: number | null;
  delivery_man_id: number | null;
  transaction_id: string;
  credit: number;
  debit: number;
  admin_bonus: number;
  balance: number;
  transaction_type: string | null;
  reference: string | null;
  reference_id: string | null;
  created_at: string | null;
}

export default async function WalletTransactionsPage() {
  const data = await adminFetch<{ total: number; items: WalletTx[] }>("/admin/wallet-transactions?limit=200");
  return (
    <TablePage
      title="Wallet ledger"
      subtitle={`${data.items.length} of ${data.total}`}
      description="View the full history of money moving in and out of customer and delivery-man wallets — every credit, debit and running balance."
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "Tx", cell: (r) => <span className="font-mono text-xs">{(r.transaction_id ?? String(r.id)).slice(0, 8)}</span> },
        { header: "Who", cell: (r) => r.user_id ? `customer #${r.user_id}` : r.delivery_man_id ? `DM #${r.delivery_man_id}` : "—" },
        { header: "Type", cell: (r) => r.transaction_type ?? "—" },
        { header: "Credit", cell: (r) => fmtMoney(r.credit) },
        { header: "Debit", cell: (r) => fmtMoney(r.debit) },
        { header: "Balance", cell: (r) => fmtMoney(r.balance) },
        { header: "Ref", cell: (r) => <span className="text-xs">{r.reference ?? ""}{r.reference_id ? ` #${r.reference_id}` : ""}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
