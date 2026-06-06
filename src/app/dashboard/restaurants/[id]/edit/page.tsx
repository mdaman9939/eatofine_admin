import Link from "next/link";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";

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
    latitude: string | number | null;
    longitude: string | number | null;
  };
  vendor: { id: number; email: string | null } | null;
}

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await adminFetch<RestaurantDetail>(`/admin/restaurants/${id}`);
  const r = data.restaurant;

  return (
    <div className="relative p-8 space-y-6 max-w-3xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> RESTAURANT MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Restaurant</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Update <span className="font-semibold">{r.name ?? `#${r.id}`}</span>&apos;s details. Changes apply
            immediately across the customer and restaurant apps.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/dashboard/restaurants/${r.id}`}
          className="text-sm text-emerald-700 hover:underline"
        >
          ← Back to restaurant
        </Link>
        <span className="text-xs text-slate-400 font-mono">#{r.id}</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/restaurants/${r.id}`}
          submitLabel="Save changes"
          redirectTo={`/dashboard/restaurants/${r.id}`}
          initialValues={{
            name: r.name,
            email: r.email,
            phone: r.phone,
            address: r.address,
            comission: r.comission,
            minimum_order: r.minimum_order,
            latitude: r.latitude,
            longitude: r.longitude,
            password: "",
            status: r.status,
            active: r.active,
          }}
          fields={[
            { name: "name", label: "Restaurant name", type: "text", required: true, placeholder: "e.g. Pizza Hub" },
            { name: "email", label: "Owner email", type: "text", placeholder: "owner@restaurant.com" },
            { name: "phone", label: "Contact phone", type: "text", placeholder: "+91-9876543210" },
            { name: "address", label: "Address", type: "textarea", placeholder: "Street, city, pincode" },
            { name: "comission", label: "Commission %", type: "number", placeholder: "e.g. 10" },
            { name: "minimum_order", label: "Minimum order ₹", type: "number", placeholder: "e.g. 100" },
            { name: "latitude", label: "Latitude", type: "text", placeholder: "e.g. 26.9124" },
            { name: "longitude", label: "Longitude", type: "text", placeholder: "e.g. 75.7873" },
            { name: "password", label: "Vendor password (leave blank to keep current)", type: "password", placeholder: "Set a new login password" },
            { name: "status", label: "Active (approved & visible)", type: "checkbox" },
            { name: "active", label: "Open now (accepting orders)", type: "checkbox" },
          ]}
        />
      </div>
    </div>
  );
}
