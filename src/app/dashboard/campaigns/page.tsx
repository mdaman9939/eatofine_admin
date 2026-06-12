import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Campaign {
  id: number;
  title: string | null;
  description: string | null;
  campaign_type?: string | null;
  price?: number | null;
  status: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

const TABS = [
  { key: "", label: "All campaigns" },
  { key: "basic", label: "Basic campaign" },
  { key: "food", label: "Food campaign" },
];

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type ?? "";
  const [data, zonesRes, foodsRes] = await Promise.all([
    adminFetch<{ total: number; items: Campaign[] }>(`/admin/campaigns?limit=200${type ? `&type=${type}` : ""}`),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ items?: Array<{ id: number; name: string | null }> }>("/admin/food?limit=300").catch(() => ({} as { items?: Array<{ id: number; name: string | null }> })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const foodOptions = (foodsRes.items ?? []).map((f) => ({ value: String(f.id), label: f.name ?? `#${f.id}` }));

  return (
    <>
      <div className="px-8 pt-8 space-y-4">
        {/* Basic vs Food campaign tabs (like StackFood's two campaign screens). */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <Link
              key={t.key || "all"}
              href={t.key ? `/dashboard/campaigns?type=${t.key}` : "/dashboard/campaigns"}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                type === t.key
                  ? "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <CreateForm
          path="/campaigns"
          title="New campaign"
          wide
          fields={[
            { name: "title", label: "Title", required: true },
            // Campaign type — Basic (whole restaurant) or Food (a specific dish).
            { name: "campaign_type", label: "Campaign type", type: "select", defaultValue: type === "food" ? "food" : "basic", options: [
              { value: "basic", label: "Basic campaign" },
              { value: "food", label: "Food campaign" },
            ] },
            { name: "description", label: "Description", type: "textarea" },
            { name: "image", label: "Campaign image", type: "image", imageDir: "campaign" },
            { name: "zone_id", label: "Zone", type: "select", options: zoneOptions },
            // Food-campaign-only fields (ignored for basic campaigns).
            { name: "food_id", label: "Food (for food campaign)", type: "select", options: foodOptions },
            { name: "price", label: "Campaign price ₹ (food campaign)", type: "number" },
            { name: "discount", label: "Discount", type: "number" },
            { name: "discount_type", label: "Discount type", type: "select", defaultValue: "percent", options: [
              { value: "percent", label: "Percent (%)" },
              { value: "amount", label: "Amount (₹)" },
            ] },
            { name: "start_date", label: "Starts", type: "date" },
            { name: "end_date", label: "Ends", type: "date" },
            { name: "start_time", label: "Daily start time", type: "text", placeholder: "HH:MM" },
            { name: "end_time", label: "Daily end time", type: "text", placeholder: "HH:MM" },
          ]}
        />
      </div>
      <TablePage
        title={type === "food" ? "Food campaigns" : type === "basic" ? "Basic campaigns" : "Campaigns"}
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title ?? "—" },
          {
            header: "Type",
            cell: (r) => {
              const isFood = r.campaign_type === "food" || r.campaign_type === "item";
              return (
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isFood ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {isFood ? "Food" : "Basic"}
                </span>
              );
            },
          },
          { header: "Price", cell: (r) => (r.price ? `₹${r.price}` : "—") },
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
