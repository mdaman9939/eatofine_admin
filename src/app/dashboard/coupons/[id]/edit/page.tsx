import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";

interface Coupon {
  id: number; title: string | null; code: string | null; discount: number; discount_type: string;
  coupon_type: string; min_purchase: number; max_discount: number; limit: number | null;
  start_date: string | null; expire_date: string | null; restaurant_id?: number | null; status: boolean;
}

const toDateInput = (d: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, zonesRes, restaurantsRes] = await Promise.all([
    adminFetch<{ coupons: Coupon[] }>("/admin/coupons"),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> }>("/admin/restaurants?limit=200").catch(() => ({} as { restaurants?: Array<{ id: number; name: string | null }>; items?: Array<{ id: number; name: string | null }> })),
  ]);
  const c = data.coupons.find((x) => String(x.id) === id);
  if (!c) notFound();
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const restOptions = (restaurantsRes.restaurants ?? restaurantsRes.items ?? []).map((r) => ({ value: String(r.id), label: r.name ?? `#${r.id}` }));

  return (
    <div className="p-8 max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard/coupons" className="text-sm text-emerald-700 hover:underline">← All coupons</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit coupon — {c.code}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/coupons/${c.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/coupons"
          initialValues={{
            title: c.title, coupon_type: c.coupon_type, discount: c.discount, discount_type: c.discount_type,
            min_purchase: c.min_purchase, max_discount: c.max_discount, restaurant_id: c.restaurant_id ?? "",
            start_date: toDateInput(c.start_date), expire_date: toDateInput(c.expire_date), limit: c.limit ?? "",
          }}
          fields={[
            { name: "title", label: "Title", type: "text", required: true },
            { name: "coupon_type", label: "Coupon type", type: "select", options: [
              { value: "default", label: "Default (all orders)" },
              { value: "first_order", label: "First order" },
              { value: "free_delivery", label: "Free delivery" },
              { value: "restaurant_wise", label: "Restaurant-wise" },
              { value: "zone_wise", label: "Zone-wise" },
            ] },
            { name: "discount", label: "Discount", type: "number", required: true },
            { name: "discount_type", label: "Discount type", type: "select", options: [{ value: "percentage", label: "%" }, { value: "amount", label: "Flat ₹" }] },
            { name: "min_purchase", label: "Minimum purchase", type: "number" },
            { name: "max_discount", label: "Max discount", type: "number" },
            { name: "restaurant_id", label: "Restaurant (for restaurant-wise)", type: "select", options: restOptions },
            { name: "zone_id", label: "Zone (for zone-wise)", type: "select", options: zoneOptions },
            { name: "start_date", label: "Starts", type: "date" },
            { name: "expire_date", label: "Expires", type: "date" },
            { name: "limit", label: "Per-customer limit", type: "number" },
          ]}
        />
      </div>
    </div>
  );
}
