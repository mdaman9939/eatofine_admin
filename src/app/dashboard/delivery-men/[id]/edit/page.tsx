import Link from "next/link";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";
import type { FieldSpec } from "../../../../../components/CreateForm";

interface Named { id: number; name?: string | null; type?: string | null }
interface DMDetail {
  delivery_man: {
    id: number;
    f_name: string | null;
    l_name: string | null;
    email: string | null;
    phone: string | null;
    image?: string | null;
    type?: string | null;
    zone_id: number | null;
    vehicle_id: number | null;
    shift_id: number | null;
    age?: number | null;
    dob?: string | null;
    identity_type?: string | null;
    identity_number?: string | null;
    status?: boolean | null;
  };
}

const toDateInput = (d: string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export default async function EditDeliveryManPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, zonesRes, vehiclesRes, shiftsRes] = await Promise.all([
    adminFetch<DMDetail>(`/admin/delivery-men/${id}`),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
    adminFetch<{ vehicles?: Named[] }>("/admin/vehicles?limit=200").catch(() => ({} as { vehicles?: Named[] })),
    adminFetch<{ shifts?: Named[] }>("/admin/shifts?limit=200").catch(() => ({} as { shifts?: Named[] })),
  ]);
  const d = data.delivery_man;
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));
  const vehicleOptions = (vehiclesRes.vehicles ?? []).map((v) => ({ value: String(v.id), label: v.type ?? v.name ?? `#${v.id}` }));
  const shiftOptions = (shiftsRes.shifts ?? []).map((s) => ({ value: String(s.id), label: s.name ?? `#${s.id}` }));

  const fields: FieldSpec[] = [
    { name: "_h_general", label: "General information", type: "heading" },
    { name: "f_name", label: "First name", type: "text", required: true },
    { name: "l_name", label: "Last name", type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "phone", label: "Phone", type: "text", required: true },
    { name: "image", label: "Delivery man image", type: "image", imageDir: "delivery-man" },

    { name: "_h_type", label: "Type, zone, vehicle & shift", type: "heading" },
    { name: "dm_type", label: "Delivery man type", type: "select", options: [
      { value: "freelancer", label: "Freelancer" },
      { value: "salary_based", label: "Salary-based" },
      { value: "restaurant_wise", label: "Restaurant-wise" },
    ] },
    { name: "zone_id", label: "Zone", type: "select", options: zoneOptions },
    { name: "vehicle_id", label: "Vehicle", type: "select", options: vehicleOptions },
    { name: "shift_id", label: "Shift", type: "select", options: shiftOptions },

    { name: "_h_additional", label: "Additional data", type: "heading" },
    { name: "age", label: "Age", type: "number" },
    { name: "dob", label: "Date of birth", type: "date" },

    { name: "_h_docs", label: "Documentation", type: "heading" },
    { name: "identity_type", label: "Identity type", type: "select", options: [
      { value: "passport", label: "Passport" },
      { value: "driving_license", label: "Driving license" },
      { value: "nid", label: "National ID" },
    ] },
    { name: "identity_number", label: "Identity number", type: "text" },
    { name: "license_image", label: "Driving license image", type: "image", imageDir: "delivery-man" },

    { name: "_h_account", label: "Account & status", type: "heading" },
    { name: "password", label: "Password (blank = keep current)", type: "password" },
    { name: "status", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="p-8 max-w-4xl space-y-5">
      <div>
        <Link href="/dashboard/delivery-men" className="text-sm text-emerald-700 hover:underline">← All delivery men</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit delivery man — {`${d.f_name ?? ""} ${d.l_name ?? ""}`.trim() || `#${d.id}`}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/delivery-men/${d.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/delivery-men"
          fields={fields}
          initialValues={{
            f_name: d.f_name,
            l_name: d.l_name,
            email: d.email,
            phone: d.phone,
            image: d.image ?? "",
            dm_type: d.type ?? "freelancer",
            zone_id: d.zone_id ?? "",
            vehicle_id: d.vehicle_id ?? "",
            shift_id: d.shift_id ?? "",
            age: d.age ?? "",
            dob: toDateInput(d.dob),
            identity_type: d.identity_type ?? "",
            identity_number: d.identity_number ?? "",
            license_image: "",
            password: "",
            status: d.status ?? true,
          }}
        />
      </div>
    </div>
  );
}
