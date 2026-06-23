import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { ReplyButton } from "../../../components/ReplyButton";

interface R {
  id: number;
  food_id: number;
  user_id: number;
  order_id: number | null;
  restaurant_id: number | null;
  rating: number;
  comment: string | null;
  reply: string | null;
  reply_at: string | null;
  status: boolean | null;
  created_at: string | null;
}

export default async function ReviewsPage() {
  const data = await adminFetch<{ total: number; items: R[] }>("/admin/reviews?limit=200");
  return (
    <TablePage
      title="Reviews"
      subtitle={`${data.items.length} of ${data.total}`}
      description="See the star ratings and comments customers left on food items, and post a public reply to any review."
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Food", cell: (r) => `#${r.food_id}` },
        { header: "User", cell: (r) => `#${r.user_id}` },
        { header: "Rating", cell: (r) => "★".repeat(r.rating) || "—" },
        { header: "Comment", cell: (r) => <span className="text-sm">{r.comment ?? ""}</span> },
        { header: "Reply", cell: (r) => r.reply ? <span className="text-xs text-emerald-600">{r.reply.slice(0, 60)}</span> : <span className="text-xs text-zinc-400">no reply</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
        { header: "Actions", cell: (r) => <ReplyButton path={`/reviews/${r.id}/reply`} initial={r.reply ?? ""} /> },
      ]}
    />
  );
}
