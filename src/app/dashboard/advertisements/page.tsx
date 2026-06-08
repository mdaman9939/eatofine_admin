import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { ActionButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Advertisement {
  id: number;
  add_type: string | null;
  title: string | null;
  start_date: string;
  end_date: string;
  status: string;
  restaurant_id: number | null;
  restaurant_name: string | null;
  is_paid: boolean;
  priority: number | null;
}

const STATUSES = ["approved", "denied", "pending", "paused", "expired", "running"];

export default async function AdvertisementsPage() {
  const [data, restaurantsRes] = await Promise.all([
    adminFetch<{ total: number; items: Advertisement[] }>("/admin/advertisements?limit=100"),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
  ]);
  const restOptions = (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` }));

  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/advertisements"
          title="Create Advertisement"
          submitLabel="Create"
          fields={[
            { name: "title", label: "Advertisement title", type: "text", required: true, placeholder: "e.g. New Branch Open Now" },
            { name: "add_type", label: "Advertisement type", type: "select", defaultValue: "restaurant_promotion", options: [
              { value: "restaurant_promotion", label: "Restaurant promotion" },
              { value: "video_promotion", label: "Video promotion" },
            ] },
            { name: "restaurant_id", label: "Restaurant / store", type: "select", options: restOptions },
            { name: "description", label: "Description", type: "textarea", placeholder: "Eye-catching advertisement copy" },
            { name: "priority", label: "Priority", type: "number", defaultValue: 0 },
            { name: "image", label: "Advertisement image", type: "image", imageDir: "advertisement" },
            { name: "cover_image", label: "Cover image", type: "image", imageDir: "advertisement" },
            { name: "start_date", label: "Start date", type: "date" },
            { name: "end_date", label: "End date", type: "date" },
          ]}
        />
      </div>
      <TablePage
        title="Advertisements"
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Type", cell: (r) => r.add_type ?? "—" },
          { header: "Restaurant", cell: (r) => r.restaurant_name ?? (r.restaurant_id ? `#${r.restaurant_id}` : "—") },
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
                <DeleteButton basePath="/advertisements" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
