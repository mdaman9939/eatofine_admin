import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { ActionButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { CreateForm } from "../../../components/CreateForm";
import { AdvertisementViewButton } from "../../../components/AdvertisementViewButton";

interface Advertisement {
  id: number;
  add_type: string | null;
  title: string | null;
  description?: string | null;
  image_full_url?: string | null;
  cover_image_full_url?: string | null;
  start_date: string;
  end_date: string;
  status: string;
  restaurant_id: number | null;
  restaurant_name: string | null;
  is_paid: boolean;
  amount?: number | null;
  priority: number | null;
  created_by_type?: string | null;
}

/** An ad is "expired" when its end date has passed (or status says so). */
function isExpired(a: Advertisement, now: number): boolean {
  if (a.status === "expired") return true;
  if (!a.end_date) return false;
  const end = new Date(a.end_date).getTime() + 86_400_000; // include whole end day
  return !Number.isNaN(end) && end < now;
}

/** Who created the ad: admin vs restaurant request. Old ads without an explicit
 *  created_by_type are treated as admin-created (panel-created historically). */
function adSource(a: Advertisement): "admin" | "restaurant" {
  return String(a.created_by_type ?? "").toLowerCase() === "vendor" ? "restaurant" : "admin";
}

const STATUSES = ["approved", "denied", "pending", "paused", "expired", "running"];

export default async function AdvertisementsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; source?: string }>;
}) {
  const sp = await searchParams;
  const view = sp.view === "expired" || sp.view === "active" ? sp.view : "all"; // all | active | expired
  const source = sp.source === "admin" || sp.source === "restaurant" ? sp.source : "all";

  const [data, restaurantsRes] = await Promise.all([
    adminFetch<{ total: number; items: Advertisement[] }>("/admin/advertisements?limit=200"),
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

  // Apply the View (all / active / expired) + Source (admin / restaurant) filters.
  const filteredItems = data.items.filter((a) => {
    const exp = isExpired(a, now);
    if (view === "expired" && !exp) return false;
    if (view === "active" && exp) return false;
    if (source !== "all" && adSource(a) !== source) return false;
    return true;
  });
  const expiredCount = data.items.filter((a) => isExpired(a, now)).length;
  const adminCount = data.items.filter((a) => adSource(a) === "admin").length;
  const restaurantCount = data.items.filter((a) => adSource(a) === "restaurant").length;
  const qp = (v: { view?: string; source?: string }) => {
    const p = new URLSearchParams();
    const nv = v.view ?? view, ns = v.source ?? source;
    if (nv !== "all") p.set("view", nv);
    if (ns !== "all") p.set("source", ns);
    const s = p.toString();
    return s ? `/dashboard/advertisements?${s}` : "/dashboard/advertisements";
  };

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
            { name: "is_paid", label: "Payment", type: "select", defaultValue: "unpaid", options: [
              { value: "unpaid", label: "Unpaid (free)" },
              { value: "paid", label: "Paid" },
            ] },
            { name: "amount", label: "Ad amount ₹", type: "number", required: true, placeholder: "e.g. 500", showWhen: { field: "is_paid", in: ["paid"] } },
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

      {/* ── Filters: see old/expired ads + admin vs restaurant-requested ── */}
      <div className="px-8 pt-6 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mr-1">Show</span>
            <Chip href={qp({ view: "all" })} active={view === "all"} label="All" count={data.items.length} />
            <Chip href={qp({ view: "active" })} active={view === "active"} label="Active" count={data.items.length - expiredCount} accent="emerald" />
            <Chip href={qp({ view: "expired" })} active={view === "expired"} label="Expired (old)" count={expiredCount} accent="rose" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mr-1">Created by</span>
            <Chip href={qp({ source: "all" })} active={source === "all"} label="Anyone" count={data.items.length} />
            <Chip href={qp({ source: "admin" })} active={source === "admin"} label="Admin" count={adminCount} accent="blue" />
            <Chip href={qp({ source: "restaurant" })} active={source === "restaurant"} label="Restaurant request" count={restaurantCount} accent="amber" />
          </div>
        </div>
      </div>

      <TablePage
        title="Advertisements"
        subtitle={`${filteredItems.length} of ${data.total}${view === "expired" ? " · expired" : view === "active" ? " · active" : ""}${source !== "all" ? ` · ${source === "admin" ? "admin-created" : "restaurant-requested"}` : ""}`}
        description="Create and manage promotional ads shown to customers — set the image, dates and priority, approve or pause restaurant requests, and remove old ones."
        rows={filteredItems}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Type", cell: (r) => r.add_type ?? "—" },
          { header: "Restaurant", cell: (r) => r.restaurant_name ?? (r.restaurant_id ? `#${r.restaurant_id}` : "—") },
          { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</span> },
          { header: "Paid", cell: (r) => (r.is_paid ? `₹${Number(r.amount ?? 0).toLocaleString("en-IN")}` : "free") },
          { header: "Status", cell: (r) => <span className="text-xs uppercase">{r.status}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-1 flex-wrap items-center">
                <AdvertisementViewButton ad={r} />
                <EditRecordButton basePath="/advertisements" id={r.id} title="Edit ad" values={r as unknown as Record<string, unknown>} fields={[
                  { name: "title", label: "Title" },
                  { name: "description", label: "Description" },
                  { name: "priority", label: "Priority", type: "number" },
                  { name: "start_date", label: "Start date", type: "date" },
                  { name: "end_date", label: "End date", type: "date" },
                  { name: "amount", label: "Amount ₹", type: "number" },
                  { name: "image", label: "Advertisement image", type: "image", imageDir: "advertisement", previewField: "image_full_url" },
                  { name: "cover_image", label: "Cover image", type: "image", imageDir: "advertisement", previewField: "cover_image_full_url" },
                ]} />
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

function Chip({ href, active, label, count, accent }: { href: string; active: boolean; label: string; count: number; accent?: "emerald" | "rose" | "blue" | "amber" }) {
  const activeTone: Record<string, string> = {
    emerald: "bg-emerald-600 text-white",
    rose: "bg-rose-600 text-white",
    blue: "bg-blue-600 text-white",
    amber: "bg-amber-500 text-white",
    default: "bg-slate-800 text-white",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        active ? (activeTone[accent ?? "default"]) : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
      }`}
    >
      {label}
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${active ? "bg-white/20" : "bg-white text-slate-500 border border-slate-200"}`}>{count}</span>
    </Link>
  );
}
