import { adminFetch } from "../../../lib/api";
import { TablePage, fmtMoney, fmtDate } from "../../../components/TablePage";

interface E {
  id: number;
  delivery_man_id: number;
  amount: number;
  method: string | null;
  ref: string | null;
  created_at: string | null;
}

export default async function DMEarningsPage() {
  const data = await adminFetch<{ total: number; items: E[] }>("/admin/dm-earnings?limit=200");
  return (
    <TablePage
      title="DM earnings"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Delivery man", cell: (r) => `#${r.delivery_man_id}` },
        { header: "Amount", cell: (r) => fmtMoney(r.amount) },
        { header: "Method", cell: (r) => r.method ?? "—" },
        { header: "Ref", cell: (r) => <span className="text-xs">{r.ref ?? ""}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
