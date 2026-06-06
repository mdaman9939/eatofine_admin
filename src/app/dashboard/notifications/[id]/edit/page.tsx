import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";

interface Notification {
  id: number; title: string | null; description: string | null;
  tergat: string | null; zone_id: number | null; image?: string | null;
}

export default async function EditNotificationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, zonesRes] = await Promise.all([
    adminFetch<{ items: Notification[] }>("/admin/notifications"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
  ]);
  const n = data.items.find((x) => String(x.id) === id);
  if (!n) notFound();
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));

  return (
    <div className="p-8 max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard/notifications" className="text-sm text-emerald-700 hover:underline">← All notifications</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit notification</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/notifications/${n.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/notifications"
          initialValues={{ title: n.title, description: n.description, tergat: n.tergat ?? "customer", zone_id: n.zone_id ?? "", image: n.image ?? "" }}
          fields={[
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Message", type: "textarea" },
            { name: "tergat", label: "Send to", type: "select", options: [
              { value: "customer", label: "Customers" },
              { value: "deliveryman", label: "Delivery men" },
              { value: "restaurant", label: "Restaurants" },
            ] },
            { name: "image", label: "Banner image", type: "image", imageDir: "notification" },
            { name: "zone_id", label: "Zone (optional)", type: "select", options: zoneOptions },
          ]}
        />
      </div>
    </div>
  );
}
