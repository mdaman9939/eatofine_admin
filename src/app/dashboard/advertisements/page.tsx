import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { ActionButton } from "../../../components/ActionButton";

interface Advertisement {
  id: number;
  add_type: string;
  title: string | null;
  start_date: string;
  end_date: string;
  status: string;
  restaurant_id: number;
  is_paid: boolean;
  priority: number | null;
}

const STATUSES = ["approved", "denied", "pending", "paused", "expired", "running"];

export default async function AdvertisementsPage() {
  const data = await adminFetch<{ total: number; items: Advertisement[] }>("/admin/advertisements?limit=100");
  return (
    <TablePage
      title="Advertisements"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Title", cell: (r) => r.title ?? "—" },
        { header: "Type", cell: (r) => r.add_type },
        { header: "Restaurant", cell: (r) => `#${r.restaurant_id}` },
        { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</span> },
        { header: "Paid", cell: (r) => (r.is_paid ? "yes" : "no") },
        { header: "Status", cell: (r) => <span className="text-xs uppercase">{r.status}</span> },
        {
          header: "Actions",
          cell: (r) => (
            <span className="flex gap-1 flex-wrap">
              {STATUSES.filter((s) => s !== r.status).slice(0, 3).map((s) => (
                <ActionButton
                  key={s}
                  path={`/advertisements/${r.id}/status`}
                  method="PATCH"
                  body={{ status: s }}
                  label={s}
                  variant="subtle"
                />
              ))}
            </span>
          ),
        },
      ]}
    />
  );
}
