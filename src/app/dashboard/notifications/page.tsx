import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Notification {
  id: number;
  title: string | null;
  description: string | null;
  tergat: string | null;
  zone_id: number | null;
  created_at: string | null;
}

export default async function NotificationsPage() {
  const data = await adminFetch<{ total: number; items: Notification[] }>("/admin/notifications");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/notifications"
          title="New push notification"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "description", label: "Message", type: "textarea" },
            {
              name: "tergat",
              label: "Target",
              type: "select",
              options: [
                { value: "customer", label: "customer" },
                { value: "deliveryman", label: "deliveryman" },
                { value: "restaurant", label: "restaurant" },
              ],
            },
            { name: "zone_id", label: "Zone ID (optional)", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Push notifications"
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Message", cell: (r) => <span className="text-zinc-600 dark:text-zinc-300">{r.description ?? ""}</span> },
          { header: "Target", cell: (r) => r.tergat ?? "—" },
          { header: "Zone", cell: (r) => r.zone_id ?? "—" },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          { header: "Actions", cell: (r) => <DeleteButton basePath="/notifications" id={r.id} /> },
        ]}
      />
    </>
  );
}
