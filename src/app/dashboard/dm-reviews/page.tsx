import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { DeleteButton } from "../../../components/ActionButton";

interface R {
  id: number;
  delivery_man_id: number | null;
  user_id: number | null;
  order_id: number | null;
  dm_name: string | null;
  user_name: string | null;
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
      description="Read the star ratings and comments customers leave for delivery men after their orders — and remove any review that is abusive or inappropriate."
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "DM", cell: (r) => r.dm_name ?? (r.delivery_man_id ? `#${r.delivery_man_id}` : "—") },
        { header: "User", cell: (r) => r.user_name ?? (r.user_id ? `#${r.user_id}` : "—") },
        { header: "Order", cell: (r) => (r.order_id ? `#${r.order_id}` : "—") },
        { header: "Rating", cell: (r) => "★".repeat(r.rating) || "—" },
        { header: "Comment", cell: (r) => <span className="text-sm">{r.comment ?? ""}</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
        { header: "", cell: (r) => <DeleteButton basePath="/dm-reviews" id={r.id} />, className: "text-right" },
      ]}
    />
  );
}
