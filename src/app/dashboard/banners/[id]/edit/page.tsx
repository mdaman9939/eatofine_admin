import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";

interface Banner {
  id: number; title: string | null; type: string; image: string | null;
  data?: string | null; zone_id?: number | null; status: boolean;
}

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, zonesRes, restaurantsRes] = await Promise.all([
    adminFetch<{ banners: Banner[] }>("/admin/banners"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
  ]);
  const b = data.banners.find((x) => String(x.id) === id);
  if (!b) notFound();
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const restOptions = (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` }));

  return (
    <div className="p-8 max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard/banners" className="text-sm text-emerald-700 hover:underline">← All banners</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit banner — {b.title}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/banners/${b.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/banners"
          initialValues={{ title: b.title, type: b.type, zone_id: b.zone_id ?? "", image: b.image ?? "", data: b.data ?? "" }}
          fields={[
            { name: "title", label: "Title", type: "text", required: true },
            { name: "type", label: "Type", type: "select", required: true, options: [
              { value: "promotional", label: "Promotional" },
              { value: "restaurant_wise", label: "Restaurant-wise" },
              { value: "food_wise", label: "Food-wise" },
              { value: "default", label: "Default" },
            ] },
            { name: "zone_id", label: "Zone", type: "select", required: true, options: zoneOptions },
            { name: "image", label: "Banner image", type: "image", imageDir: "banner" },
            { name: "data", label: "Link target — restaurant", type: "select", options: restOptions },
          ]}
        />
      </div>
    </div>
  );
}
