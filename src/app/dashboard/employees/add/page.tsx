import Link from "next/link";
import { CreateForm, type FieldSpec } from "../../../../components/CreateForm";
import { adminFetch } from "../../../../lib/api";

interface Role { id: number; name: string }

export default async function AddEmployeePage() {
  const [rolesRes, zonesRes] = await Promise.all([
    adminFetch<{ roles: Role[] }>("/admin/admin-roles").catch(() => ({ roles: [] as Role[] })),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
  ]);
  const roleOptions = rolesRes.roles.map((r) => ({ value: String(r.id), label: r.name }));
  const zoneOptions = zonesRes.zones.map((z) => ({ value: String(z.id), label: z.name ?? `Zone ${z.id}` }));

  const fields: FieldSpec[] = buildEmployeeFields(roleOptions, zoneOptions, true);

  return (
    <div className="relative p-8 space-y-6 max-w-3xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> STAFF · EMPLOYEE MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Add New Employee</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Create a staff account with a role (permissions) and zone — same as StackFood. They log in with the email + password set here.
          </p>
        </div>
      </div>

      <div>
        <Link href="/dashboard/employees" className="text-sm text-emerald-700 hover:underline">← All employees</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <CreateForm path="/employees" title="New employee" submitLabel="Submit" embedded redirectTo="/dashboard/employees" fields={fields} />
      </div>
    </div>
  );
}

/** Shared field list — reused by the edit page so add/edit never drift. */
export function buildEmployeeFields(
  roleOptions: Array<{ value: string; label: string }>,
  zoneOptions: Array<{ value: string; label: string }>,
  withPassword: boolean,
): FieldSpec[] {
  return [
    { name: "_h_general", label: "General information", type: "heading" },
    { name: "f_name", label: "First name", type: "text", required: true, placeholder: "e.g. John" },
    { name: "l_name", label: "Last name", type: "text", placeholder: "e.g. Doe" },
    { name: "image", label: "Employee image", type: "image", imageDir: "employee" },
    { name: "zone_id", label: "Zone (blank = All)", type: "select", options: zoneOptions },
    { name: "role_id", label: "Role", type: "select", required: true, options: roleOptions },
    { name: "phone", label: "Phone", type: "text", placeholder: "+91-9876543210" },

    { name: "_h_account", label: "Account info", type: "heading" },
    { name: "email", label: "Email", type: "text", required: true, placeholder: "ex: ex@gmail.com" },
    ...(withPassword
      ? [
          { name: "password", label: "Password (min 8)", type: "password", required: true } as FieldSpec,
          { name: "confirm_password", label: "Confirm password", type: "password", required: true } as FieldSpec,
        ]
      : [
          { name: "password", label: "Password (blank = keep current)", type: "password" } as FieldSpec,
          { name: "confirm_password", label: "Confirm password", type: "password" } as FieldSpec,
        ]),
  ];
}
