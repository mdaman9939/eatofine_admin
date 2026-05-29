import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { ReplyButton } from "../../../components/ReplyButton";

interface CM {
  id: number;
  name: string;
  email: string;
  mobile_number: string | null;
  subject: string | null;
  message: string;
  reply: string | null;
  seen: boolean | null;
  created_at: string | null;
}

export default async function ContactMessagesPage() {
  const data = await adminFetch<{ total: number; items: CM[] }>("/admin/contact-messages?limit=200");
  return (
    <TablePage
      title="Contact messages"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "From", cell: (r) => <><div>{r.name}</div><div className="text-xs text-zinc-500">{r.email}</div></> },
        { header: "Subject", cell: (r) => r.subject ?? "—" },
        { header: "Message", cell: (r) => <span className="text-sm">{r.message.slice(0, 120)}</span> },
        { header: "Reply", cell: (r) => r.reply ? <span className="text-xs text-emerald-600">{r.reply.slice(0, 80)}</span> : <span className="text-xs text-amber-600">unread</span> },
        { header: "When", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
        { header: "Actions", cell: (r) => <ReplyButton path={`/contact-messages/${r.id}/reply`} initial={r.reply ?? ""} /> },
      ]}
    />
  );
}
