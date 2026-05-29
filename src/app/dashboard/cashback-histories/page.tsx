import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";

interface H {
  id: number;
  cash_back_id: number | null;
  order_id: number | null;
  user_id: number | null;
  cashback_type: string;
  cashback_amount: number;
  calculated_amount: number;
  min_purchase: number;
  max_discount: number;
  created_at: string | null;
}

export default async function CashbackHistoriesPage() {
  const data = await adminFetch<{ total: number; items: H[] }>("/admin/cashback-histories?limit=200");
  return (
    <TablePage
      title="Cashback history"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Order", cell: (r) => r.order_id ? `#${r.order_id}` : "—" },
        { header: "Customer", cell: (r) => r.user_id ? `#${r.user_id}` : "—" },
        { header: "Type", cell: (r) => r.cashback_type },
        { header: "Cashback", cell: (r) => `₹${r.cashback_amount}` },
        { header: "Calculated", cell: (r) => `₹${r.calculated_amount}` },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
