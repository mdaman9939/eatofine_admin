import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";

interface Campaign {
  id: number; title: string | null; description: string | null;
  start_date: string | null; end_date: string | null;
  start_time?: string | null; end_time?: string | null; image?: string | null; zone_id?: number | null;
}

const toDateInput = (d: string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, zonesRes] = await Promise.all([
    adminFetch<{ items: Campaign[] }>("/admin/campaigns"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
  ]);
  const c = data.items.find((x) => String(x.id) === id);
  if (!c) notFound();
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));

  return (
    <div className="p-8 max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard/campaigns" className="text-sm text-emerald-700 hover:underline">← All campaigns</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit campaign — {c.title}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/campaigns/${c.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/campaigns"
          initialValues={{
            title: c.title, description: c.description, image: c.image ?? "", zone_id: c.zone_id ?? "",
            start_date: toDateInput(c.start_date), end_date: toDateInput(c.end_date),
            start_time: c.start_time ?? "", end_time: c.end_time ?? "",
          }}
          fields={[
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "image", label: "Campaign image", type: "image", imageDir: "campaign" },
            { name: "zone_id", label: "Zone", type: "select", options: zoneOptions },
            { name: "start_date", label: "Starts", type: "date" },
            { name: "end_date", label: "Ends", type: "date" },
            { name: "start_time", label: "Daily start time", type: "text", placeholder: "HH:MM" },
            { name: "end_time", label: "Daily end time", type: "text", placeholder: "HH:MM" },
          ]}
        />
      </div>
    </div>
  );
}
