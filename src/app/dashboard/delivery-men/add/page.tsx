import { CreateForm, type FieldSpec } from "../../../../components/CreateForm";
import { adminFetch } from "../../../../lib/api";

interface Named { id: number; name?: string | null; type?: string | null }

export default async function AddDeliveryManPage() {
  const [zonesRes, vehiclesRes, shiftsRes] = await Promise.all([
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ vehicles?: Named[] }>("/admin/vehicles?limit=200").catch(() => ({} as { vehicles?: Named[] })),
    adminFetch<{ shifts?: Named[] }>("/admin/shifts?limit=200").catch(() => ({} as { shifts?: Named[] })),
  ]);
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const vehicleOptions = (vehiclesRes.vehicles ?? []).map((v) => ({ value: String(v.id), label: v.type ?? v.name ?? `#${v.id}` }));
  const shiftOptions = (shiftsRes.shifts ?? []).map((s) => ({ value: String(s.id), label: s.name ?? `#${s.id}` }));

  const fields: FieldSpec[] = [
    { name: "_h_general", label: "General information", type: "heading" },
    { name: "f_name", label: "First name", type: "text", required: true, placeholder: "e.g. Rajesh" },
    { name: "l_name", label: "Last name", type: "text", placeholder: "Kumar" },
    { name: "email", label: "Email", type: "text", placeholder: "rajesh@delivery.demo" },
    { name: "phone", label: "Phone", type: "text", required: true, placeholder: "+919999900001" },
    { name: "image", label: "Delivery man image", type: "image", imageDir: "delivery-man" },

    { name: "_h_type", label: "Type, zone, vehicle & shift", type: "heading" },
    { name: "dm_type", label: "Delivery man type", type: "select", defaultValue: "freelancer", options: [
      { value: "freelancer", label: "Freelancer" },
      { value: "salary_based", label: "Salary-based" },
      { value: "restaurant_wise", label: "Restaurant-wise" },
    ] },
    { name: "zone_id", label: "Zone", type: "select", required: true, options: zoneOptions },
    { name: "vehicle_id", label: "Vehicle", type: "select", options: vehicleOptions },
    { name: "shift_id", label: "Shift", type: "select", options: shiftOptions },

    { name: "_h_additional", label: "Additional data", type: "heading" },
    { name: "age", label: "Age", type: "number", placeholder: "e.g. 28" },
    { name: "dob", label: "Date of birth", type: "date" },

    { name: "_h_docs", label: "Documentation", type: "heading" },
    { name: "identity_type", label: "Identity type", type: "select", defaultValue: "passport", options: [
      { value: "passport", label: "Passport" },
      { value: "driving_license", label: "Driving license" },
      { value: "nid", label: "National ID" },
    ] },
    { name: "identity_number", label: "Identity number", type: "text", placeholder: "ID number" },
    { name: "identity_image", label: "Identity documents", type: "documents", imageDir: "delivery-man" },
    { name: "license_image", label: "Driving license image", type: "image", imageDir: "delivery-man" },

    { name: "_h_account", label: "Account", type: "heading" },
    { name: "password", label: "Password (default: 12345678)", type: "password", placeholder: "Leave blank for default" },
  ];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> DELIVERYMEN MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add New Delivery Man</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Full StackFood-style onboarding — image, type, zone, vehicle, shift, age/DOB, documentation and driving
            license. They&apos;re approved + login-ready immediately.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm
          path="/delivery-men"
          title="New delivery man"
          submitLabel="Add delivery man"
          embedded
          redirectTo="/dashboard/delivery-men"
          fields={fields}
        />
      </div>
    </div>
  );
}
