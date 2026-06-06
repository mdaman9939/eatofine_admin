import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Campaign {
  id: number;
  title: string | null;
  description: string | null;
  status: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

export default async function CampaignsPage() {
  const [data, zonesRes] = await Promise.all([
    adminFetch<{ total: number; items: Campaign[] }>("/admin/campaigns"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/campaigns"
          title="New campaign"
          fields={[
            { name: "title", label: "Title", required: true },
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
      <TablePage
        title="Campaigns"
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <Link href={`/dashboard/campaigns/${r.id}/edit`} className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">Edit</Link>
                <ToggleStatusButton basePath="/campaigns" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/campaigns" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
