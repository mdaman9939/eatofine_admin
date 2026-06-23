import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate, StatusBadge } from "../../../components/TablePage";
import { DeleteButton, ToggleStatusButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Notification {
  id: number;
  title: string | null;
  description: string | null;
  tergat: string | null;
  zone_id: number | null;
  image: string | null;
  status: boolean;
  created_at: string | null;
}

// Storage base derived from the API env, the same way ImageUpload does it, so
// banner thumbnails resolve in both dev and the deployed app.
const STORAGE_BASE =
  ((process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/api\/v1\/?$/, "") || "http://127.0.0.1:3000") +
  "/storage/notification/";

export default async function NotificationsPage() {
  const [data, zonesRes] = await Promise.all([
    adminFetch<{ total: number; items: Notification[] }>("/admin/notifications"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
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
              label: "Send to",
              type: "select",
              defaultValue: "customer",
              options: [
                { value: "customer", label: "Customers" },
                { value: "deliveryman", label: "Delivery men" },
                { value: "restaurant", label: "Restaurants" },
              ],
            },
            { name: "image", label: "Notification banner", type: "image", imageDir: "notification" },
            { name: "zone_id", label: "Zone (blank = All)", type: "select", options: zoneOptions },
          ]}
        />
      </div>
      <TablePage
        title="Push notifications"
        subtitle={`${data.items.length} of ${data.total}`}
        description="Create and send promotional push notifications to customers, delivery men or restaurants — target a zone, add a banner, and enable or remove them."
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          {
            header: "Banner",
            cell: (r) =>
              r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${STORAGE_BASE}${r.image}`} alt="banner" className="w-12 h-9 rounded object-cover ring-1 ring-slate-200" />
              ) : (
                <span className="text-slate-300 text-xs">—</span>
              ),
          },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Message", cell: (r) => <span className="text-zinc-600 dark:text-zinc-300">{r.description ?? ""}</span> },
          { header: "Target", cell: (r) => r.tergat ?? "—" },
          { header: "Zone", cell: (r) => r.zone_id ?? "—" },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <Link href={`/dashboard/notifications/${r.id}/edit`} className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">Edit</Link>
                <ToggleStatusButton basePath="/notifications" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/notifications" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
