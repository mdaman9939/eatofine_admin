import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";

interface D {
  id: number;
  title: string;
  description: string | null;
  total_amount: number;
  status: string;
  created_for: string;
  created_at: string | null;
}

export default async function DisbursementsPage() {
  const data = await adminFetch<{ total: number; items: D[] }>("/admin/disbursements?limit=100");
  return (
    <TablePage
      title="Disbursements"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Title", cell: (r) => r.title },
        { header: "For", cell: (r) => r.created_for },
        { header: "Amount", cell: (r) => `₹${r.total_amount.toFixed(2)}` },
        { header: "Status", cell: (r) => <span className="text-xs uppercase">{r.status}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
