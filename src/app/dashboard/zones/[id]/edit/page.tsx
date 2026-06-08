import Link from "next/link";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";
import { type FieldSpec } from "../../../../../components/CreateForm";

interface ZoneDetail {
  zone: {
    id: number;
    name: string | null;
    display_name: string | null;
    coordinates: Array<{ lat: number; lng: number }>;
    status: boolean;
    is_default: boolean;
    zone_for: string;
    minimum_shipping_charge: number;
    per_km_shipping_charge: number;
    maximum_shipping_charge: number;
    minimum_delivery_time: number;
    max_cod_order_amount: number;
  };
}

export default async function EditZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { zone } = await adminFetch<ZoneDetail>(`/admin/zones/${id}`);
  const zoneFor = zone.zone_for === "deliveryman" ? "deliveryman" : "restaurant";
  const isDm = zoneFor === "deliveryman";

  const fields: FieldSpec[] = [
    { name: "name", label: "Zone name", type: "text", required: true, placeholder: "e.g. Bengaluru / Whitefield" },
    { name: "display_name", label: "Zone display name", type: "text", placeholder: "Customer-facing label" },
    { name: "coordinates", label: "Zone coverage area", type: "polygon" },
    { name: "zone_for", label: "Zone for", type: "select", options: [
      { value: "restaurant", label: "Restaurant" },
      { value: "deliveryman", label: "Deliveryman" },
    ] },
    { name: "minimum_shipping_charge", label: "Min ship ₹", type: "number", required: true },
    { name: "per_km_shipping_charge", label: "Per-km charge ₹", type: "number", required: true },
    { name: "maximum_shipping_charge", label: "Max ship cap ₹", type: "number", required: true },
    { name: "minimum_delivery_time", label: "Min ETA (minutes)", type: "number", required: true },
    { name: "max_cod_order_amount", label: "Max COD order ₹", type: "number" },
    { name: "is_default", label: "Set as default zone", type: "checkbox" },
  ];

  return (
    <div className="relative p-8 space-y-6 max-w-4xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> {isDm ? "DELIVERYMEN MANAGEMENT · ZONE SETUP" : "RESTAURANT MANAGEMENT · ZONE SETUP"}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Zone</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Update <span className="font-semibold">{zone.name ?? `#${zone.id}`}</span> — redraw the coverage polygon
            (click to add boundary points) or change its shipping math. Changes apply immediately.
          </p>
        </div>
      </div>

      <div>
        <Link href={`/dashboard/zones?for=${zoneFor}`} className="text-sm text-emerald-700 hover:underline">← All zones</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/zones/${zone.id}`}
          submitLabel="Save zone"
          redirectTo={`/dashboard/zones?for=${zoneFor}`}
          fields={fields}
          initialValues={{
            name: zone.name,
            display_name: zone.display_name,
            coordinates: JSON.stringify(zone.coordinates ?? []),
            zone_for: zoneFor,
            minimum_shipping_charge: zone.minimum_shipping_charge,
            per_km_shipping_charge: zone.per_km_shipping_charge,
            maximum_shipping_charge: zone.maximum_shipping_charge,
            minimum_delivery_time: zone.minimum_delivery_time,
            max_cod_order_amount: zone.max_cod_order_amount,
            is_default: zone.is_default,
          }}
        />
      </div>
    </div>
  );
}
