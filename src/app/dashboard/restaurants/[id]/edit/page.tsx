import Link from "next/link";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";
import type { FieldSpec } from "../../../../../components/CreateForm";

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

interface RestaurantDetail {
  restaurant: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    status: boolean;
    active: boolean;
    minimum_order: number;
    comission: number | null;
    tax: number;
    latitude: string | number | null;
    longitude: string | number | null;
    zone_id: number | null;
    cuisine_ids?: number[] | null;
    delivery_time?: string | null;
    logo?: string | null;
    cover_photo?: string | null;
    veg?: boolean;
    non_veg?: boolean;
    delivery?: boolean;
    take_away?: boolean;
    identity_number?: string | null;
    state?: string | null;
  };
}

/** Parse Laravel's "min-max-type" delivery_time string into [min, max]. */
function parseDeliveryTime(dt: string | null | undefined): [number | "", number | ""] {
  if (!dt) return ["", ""];
  const [min, max] = dt.split("-");
  return [min ? Number(min) : "", max ? Number(max) : ""];
}

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, zonesRes, cuisinesRes] = await Promise.all([
    adminFetch<RestaurantDetail>(`/admin/restaurants/${id}`),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ cuisines: Array<{ id: number; name: string | null }> }>("/admin/cuisines").catch(() => ({ cuisines: [] })),
  ]);
  const r = data.restaurant;
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const cuisineOptions = cuisinesRes.cuisines.map((c) => ({ value: String(c.id), label: c.name ?? `Cuisine ${c.id}` }));
  const [minDt, maxDt] = parseDeliveryTime(r.delivery_time);

  const fields: FieldSpec[] = [
    { name: "_h_info", label: "Restaurant information", type: "heading" },
    { name: "name", label: "Restaurant name", type: "text", required: true, placeholder: "e.g. Pizza Hub" },
    { name: "address", label: "Address", type: "textarea", placeholder: "Street, city, pincode" },
    { name: "cuisine_ids", label: "Cuisines", type: "multiselect", options: cuisineOptions },
    { name: "zone_id", label: "Zone", type: "select", options: zoneOptions },

    { name: "_h_loc", label: "Location", type: "heading" },
    { name: "coordinates", label: "Map location", type: "latlng" },

    { name: "_h_general", label: "General settings", type: "heading" },
    { name: "minimum_order", label: "Minimum order ₹", type: "number" },
    { name: "minimum_delivery_time", label: "Min delivery time (min)", type: "number" },
    { name: "maximum_delivery_time", label: "Max delivery time (min)", type: "number" },
    { name: "tax", label: "GST %", type: "number" },
    { name: "comission", label: "Commission %", type: "number" },

    { name: "_h_brand", label: "Logo & cover", type: "heading" },
    { name: "logo", label: "Restaurant logo (1:1)", type: "image", imageDir: "restaurant" },
    { name: "cover_photo", label: "Restaurant cover", type: "image", imageDir: "restaurant/cover" },

    { name: "_h_additional", label: "Additional data", type: "heading" },
    { name: "identity_number", label: "Owner ID / GSTIN number", type: "text", placeholder: "Enter your ID number" },
    { name: "state", label: "State", type: "select", options: INDIAN_STATES.map((s) => ({ value: s, label: s })) },

    { name: "_h_account", label: "Account information", type: "heading" },
    { name: "email", label: "Owner email", type: "text", placeholder: "owner@restaurant.com" },
    { name: "phone", label: "Contact phone", type: "text", placeholder: "+91-9876543210" },
    { name: "password", label: "Vendor password (leave blank to keep current)", type: "password", placeholder: "Set a new login password" },

    { name: "_h_caps", label: "Capabilities & status", type: "heading" },
    { name: "delivery", label: "Delivery enabled", type: "checkbox" },
    { name: "take_away", label: "Takeaway enabled", type: "checkbox" },
    { name: "veg", label: "Serves veg", type: "checkbox" },
    { name: "non_veg", label: "Serves non-veg", type: "checkbox" },
    { name: "status", label: "Active (approved & visible)", type: "checkbox" },
    { name: "active", label: "Open now (accepting orders)", type: "checkbox" },
  ];

  return (
    <div className="relative p-8 space-y-6 max-w-4xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> RESTAURANT MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Restaurant</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Update <span className="font-semibold">{r.name ?? `#${r.id}`}</span>&apos;s full details — info, cuisines,
            location, logo, taxes, account. Changes apply immediately across the customer and restaurant apps.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href={`/dashboard/restaurants/${r.id}`} className="text-sm text-emerald-700 hover:underline">← Back to restaurant</Link>
        <span className="text-xs text-slate-400 font-mono">#{r.id}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/restaurants/${r.id}`}
          submitLabel="Save changes"
          redirectTo={`/dashboard/restaurants/${r.id}`}
          initialValues={{
            name: r.name,
            address: r.address,
            cuisine_ids: (r.cuisine_ids ?? []).map(Number),
            zone_id: r.zone_id ?? "",
            coordinates: r.latitude != null && r.longitude != null ? `${r.latitude},${r.longitude}` : "",
            minimum_order: r.minimum_order,
            minimum_delivery_time: minDt,
            maximum_delivery_time: maxDt,
            tax: r.tax,
            comission: r.comission,
            logo: r.logo ?? "",
            cover_photo: r.cover_photo ?? "",
            identity_number: r.identity_number ?? "",
            state: r.state ?? "",
            email: r.email,
            phone: r.phone,
            password: "",
            delivery: r.delivery ?? true,
            take_away: r.take_away ?? true,
            veg: r.veg ?? true,
            non_veg: r.non_veg ?? true,
            status: r.status,
            active: r.active,
          }}
          fields={fields}
        />
      </div>
    </div>
  );
}
