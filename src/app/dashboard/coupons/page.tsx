import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate, fmtMoney } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

const editLinkCls = "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200";

interface Coupon {
  id: number;
  title: string | null;
  code: string | null;
  start_date: string | null;
  expire_date: string | null;
  min_purchase: number;
  max_discount: number;
  discount: number;
  discount_type: string;
  coupon_type: string;
  limit: number | null;
  total_uses: number;
  status: boolean;
}

export default async function CouponsPage() {
  const [data, zonesRes, restaurantsRes, usersRes] = await Promise.all([
    adminFetch<{ coupons: Coupon[] }>("/admin/coupons"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
    adminFetch<{ users?: Array<{ id: number; f_name: string | null; l_name: string | null; phone: string | null }> }>("/admin/users?limit=200").catch(() => ({} as { users?: Array<{ id: number; f_name: string | null; l_name: string | null; phone: string | null }> })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const restOptions = (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` }));
  const customerOptions = (usersRes.users ?? []).map((u) => ({
    value: String(u.id),
    label: `${u.f_name ?? ""} ${u.l_name ?? ""}`.trim() || u.phone || `#${u.id}`,
  }));
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/coupons"
          title="New coupon"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "code", label: "Code", required: true, placeholder: "WELCOME10", generate: true },
            { name: "coupon_type", label: "Coupon type", type: "select", defaultValue: "default", options: [
              { value: "default", label: "Default (all orders)" },
              { value: "first_order", label: "First order" },
              { value: "free_delivery", label: "Free delivery" },
              { value: "restaurant_wise", label: "Restaurant-wise" },
              { value: "zone_wise", label: "Zone-wise" },
            ] },
            { name: "restaurant_id", label: "Restaurant (for restaurant-wise)", type: "select", options: restOptions },
            { name: "zone_id", label: "Zone (for zone-wise)", type: "select", options: zoneOptions },
            { name: "customer_id", label: "Customer (blank = all)", type: "select", options: customerOptions },
            { name: "discount", label: "Discount", type: "number", required: true },
            { name: "discount_type", label: "Discount type", type: "select", options: [{ value: "percentage", label: "%" }, { value: "amount", label: "Flat ₹" }], defaultValue: "percentage" },
            { name: "min_purchase", label: "Minimum purchase", type: "number" },
            { name: "max_discount", label: "Max discount", type: "number" },
            { name: "start_date", label: "Starts", type: "date" },
            { name: "expire_date", label: "Expires", type: "date" },
            { name: "limit", label: "Per-customer limit", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Coupons"
        subtitle={`${data.coupons.length} coupons`}
        rows={data.coupons}
        rowKey={(r) => r.id}
        columns={[
          { header: "Code", cell: (r) => <span className="font-mono">{r.code}</span> },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Discount", cell: (r) => `${r.discount}${r.discount_type === "percentage" ? "%" : "₹"}` },
          { header: "Min purchase", cell: (r) => fmtMoney(r.min_purchase) },
          { header: "Max discount", cell: (r) => fmtMoney(r.max_discount) },
          { header: "Uses", cell: (r) => `${r.total_uses}${r.limit ? `/${r.limit}` : ""}` },
          { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date)} – {fmtDate(r.expire_date)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <Link href={`/dashboard/coupons/${r.id}/edit`} className={editLinkCls}>Edit</Link>
                <ToggleStatusButton basePath="/coupons" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/coupons" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
