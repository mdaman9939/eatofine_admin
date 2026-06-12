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

  // "Currently running" = approved/running AND today is within its date window
  // (end_date is a calendar day, so we include the whole end day).
  const now = Date.now();
  const running = data.items.filter((a) => {
    const statusOk = a.status === "approved" || a.status === "running";
    const start = a.start_date ? new Date(a.start_date).getTime() : 0;
    const end = a.end_date ? new Date(a.end_date).getTime() + 86_400_000 : Number.POSITIVE_INFINITY;
    return statusOk && (!Number.isNaN(start)) && start <= now && now <= end;
  });

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

      {/* ── Currently Running slab — approved ads active right now ── */}
      <div className="px-8 pt-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">Currently Running</h2>
              <span className="ml-1 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">{running.length}</span>
            </div>
            <span className="text-xs text-slate-500">Approved advertisements active right now (within their date window)</span>
          </div>
          {running.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 text-sm">No advertisements are running right now.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-emerald-50/60 text-left text-[11px] uppercase tracking-wider text-emerald-700/80">
                  <tr>
                    <th className="px-6 py-2.5 font-semibold">#</th>
                    <th className="px-4 py-2.5 font-semibold">Title</th>
                    <th className="px-4 py-2.5 font-semibold">Restaurant</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Ends</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {running.map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-50/40">
                      <td className="px-6 py-2.5 font-mono text-xs text-slate-400">{r.id}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{r.title ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{r.restaurant_name ?? (r.restaurant_id ? `#${r.restaurant_id}` : "—")}</td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{r.add_type ?? "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600 text-xs">{fmtDate(r.end_date)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{r.priority ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
