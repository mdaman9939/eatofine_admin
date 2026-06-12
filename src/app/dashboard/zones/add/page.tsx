import Link from "next/link";
import { CreateForm, type FieldSpec } from "../../../../components/CreateForm";

export default async function AddZonePage({
  searchParams,
}: {
  searchParams: Promise<{ for?: string }>;
}) {
  const sp = await searchParams;
  const zoneFor = sp.for === "deliveryman" ? "deliveryman" : "restaurant";
  const isDm = zoneFor === "deliveryman";
  const fields: FieldSpec[] = [
    { name: "name", label: "Zone name", type: "text", required: true, placeholder: "e.g. Bengaluru / Whitefield" },
    { name: "display_name", label: "Zone display name", type: "text", placeholder: "Customer-facing label" },
    // The map polygon — draw the coverage area like StackFood's Zone Setup.
    { name: "coordinates", label: "Zone coverage area", type: "polygon" },
    // Tag the zone as restaurant or deliveryman (hidden value via default).
    { name: "zone_for", label: "Zone for", type: "select", defaultValue: zoneFor, options: [
      { value: "restaurant", label: "Restaurant" },
      { value: "deliveryman", label: "Deliveryman" },
    ] },
    { name: "minimum_shipping_charge", label: "Min ship ₹", type: "number", required: true, defaultValue: 20 },
    { name: "per_km_shipping_charge", label: "Per-km charge ₹", type: "number", required: true, defaultValue: 6 },
    { name: "maximum_shipping_charge", label: "Max ship cap ₹", type: "number", required: true, defaultValue: 200 },
    { name: "minimum_delivery_time", label: "Min ETA (minutes)", type: "number", required: true, defaultValue: 30 },
    { name: "max_cod_order_amount", label: "Max COD order ₹", type: "number", defaultValue: 5000 },
    { name: "is_default", label: "Set as default zone", type: "checkbox" },
  ];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> {isDm ? "DELIVERYMEN MANAGEMENT · ZONE SETUP" : "RESTAURANT MANAGEMENT · ZONE SETUP"}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{isDm ? "Deliveryman Zone Setup" : "Restaurant Zone Setup"}</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Draw the zone&apos;s coverage area on the map (click to drop boundary points — at least 3 to form a
            polygon), then set its shipping math. {isDm ? "Delivery men are matched to orders within their zone." : "Restaurants belong to a zone; customers only see restaurants whose zone polygon contains their location."}
          </p>
        </div>
      </div>

      <div>
        <Link href={`/dashboard/zones?for=${zoneFor}`} className="text-sm text-emerald-700 hover:underline">← All zones</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm
          path="/zones"
          title="New zone"
          submitLabel="Create zone"
          embedded
          redirectTo={`/dashboard/zones?for=${zoneFor}`}
          fields={fields}
        />
      </div>
    </div>
  );
}
