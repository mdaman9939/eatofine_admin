import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Banner {
  id: number;
  title: string;
  type: string;
  image: string | null;
  status: boolean;
  zone_id: number;
  created_at: string | null;
}

export default async function BannersPage() {
  const [data, zonesRes, restaurantsRes] = await Promise.all([
    adminFetch<{ banners: Banner[] }>("/admin/banners"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const restOptions = (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` }));
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/banners"
          title="New banner"
          fields={[
            { name: "title", label: "Title", required: true },
            {
              name: "type",
              label: "Type",
              type: "select",
              required: true,
              options: [
                { value: "promotional", label: "Promotional" },
                { value: "restaurant_wise", label: "Restaurant-wise" },
                { value: "food_wise", label: "Food-wise" },
                { value: "default", label: "Default" },
              ],
            },
            { name: "zone_id", label: "Zone", type: "select", required: true, options: zoneOptions },
            { name: "image", label: "Banner image", type: "image", imageDir: "banner" },
            { name: "data", label: "Link target — restaurant", type: "select", options: restOptions },
          ]}
        />
      </div>
      <TablePage
        title="Banners"
        subtitle={`${data.banners.length} banners`}
        rows={data.banners}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title },
          { header: "Type", cell: (r) => <span className="text-xs uppercase">{r.type}</span> },
          { header: "Zone", cell: (r) => r.zone_id },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <Link href={`/dashboard/banners/${r.id}/edit`} className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">Edit</Link>
                <ToggleStatusButton basePath="/banners" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/banners" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
