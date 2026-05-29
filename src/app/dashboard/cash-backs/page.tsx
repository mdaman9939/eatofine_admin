import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";

interface CashBack {
  id: number;
  title: string | null;
  cashback_type: string | null;
  cashback_amount: number | null;
  min_purchase: number | null;
  max_discount: number | null;
  status: boolean | null;
}

export default async function CashBacksPage() {
  const data = await adminFetch<{ cash_backs: CashBack[] }>("/admin/cash-backs");
  return (
    <TablePage
      title="Cashbacks"
      subtitle={`${data.cash_backs.length} rules`}
      rows={data.cash_backs}
      rowKey={(r) => r.id}
      empty="No cashback rules configured."
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Title", cell: (r) => r.title ?? "—" },
        { header: "Type", cell: (r) => r.cashback_type ?? "—" },
        { header: "Amount", cell: (r) => r.cashback_amount ?? "—" },
        { header: "Min purchase", cell: (r) => r.min_purchase ?? "—" },
        { header: "Max discount", cell: (r) => r.max_discount ?? "—" },
        { header: "Status", cell: (r) => <StatusBadge value={!!r.status} /> },
      ]}
    />
  );
}
