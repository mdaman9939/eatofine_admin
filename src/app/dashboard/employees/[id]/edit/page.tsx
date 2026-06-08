import Link from "next/link";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";
import { buildEmployeeFields } from "../../add/page";

interface Role { id: number; name: string }
interface EmployeeDetail {
  employee: {
    id: number;
    f_name: string | null;
    l_name: string | null;
    email: string | null;
    phone: string | null;
    image: string | null;
    role_id: number | null;
    zone_id: number | null;
  };
}

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, rolesRes, zonesRes] = await Promise.all([
    adminFetch<EmployeeDetail>(`/admin/employees/${id}`),
    adminFetch<{ roles: Role[] }>("/admin/admin-roles").catch(() => ({ roles: [] as Role[] })),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
  ]);
  const e = data.employee;
  const roleOptions = rolesRes.roles.map((r) => ({ value: String(r.id), label: r.name }));
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));

  return (
    <div className="p-8 max-w-3xl space-y-5">
      <div>
        <Link href="/dashboard/employees" className="text-sm text-emerald-700 hover:underline">← All employees</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit employee — {`${e.f_name ?? ""} ${e.l_name ?? ""}`.trim() || `#${e.id}`}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/employees/${e.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/employees"
          fields={buildEmployeeFields(roleOptions, zoneOptions, false)}
          initialValues={{
            f_name: e.f_name,
            l_name: e.l_name,
            image: e.image ?? "",
            zone_id: e.zone_id ?? "",
            role_id: e.role_id ?? "",
            phone: e.phone,
            email: e.email,
            password: "",
            confirm_password: "",
          }}
        />
      </div>
    </div>
  );
}
