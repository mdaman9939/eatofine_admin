import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";

interface R {
  id: number;
  delivery_man_id: number;
  user_id: number;
  order_id: number;
  rating: number;
  comment: string | null;
  status: boolean | null;
  created_at: string | null;
}

export default async function DMReviewsPage() {
  const data = await adminFetch<{ total: number; items: R[] }>("/admin/dm-reviews?limit=200");
  return (
    <TablePage
      title="DM reviews"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "DM", cell: (r) => `#${r.delivery_man_id}` },
        { header: "User", cell: (r) => `#${r.user_id}` },
        { header: "Order", cell: (r) => `#${r.order_id}` },
        { header: "Rating", cell: (r) => "★".repeat(r.rating) || "—" },
        { header: "Comment", cell: (r) => <span className="text-sm">{r.comment ?? ""}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
