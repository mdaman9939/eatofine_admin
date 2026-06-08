import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { DeleteButton } from "../../../components/ActionButton";

interface E {
  id: number;
  f_name: string | null;
  l_name: string | null;
  email: string;
  phone: string | null;
  role_id: number;
  zone_id: number | null;
  created_at: string | null;
}
interface Role { id: number; name: string }

export default async function EmployeesPage() {
  const [data, rolesRes, zonesRes] = await Promise.all([
    adminFetch<{ total: number; items: E[] }>("/admin/employees?limit=200"),
    adminFetch<{ roles: Role[] }>("/admin/admin-roles").catch(() => ({ roles: [] as Role[] })),
    adminFetch<{ zones: Array<{ id: number; name: string | null }> }>("/admin/zones").catch(() => ({ zones: [] })),
  ]);
  const roleName = new Map(rolesRes.roles.map((r) => [r.id, r.name]));
  const zoneName = new Map(zonesRes.zones.map((z) => [z.id, z.name ?? `Zone ${z.id}`]));

  return (
    <>
      <div className="px-8 pt-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-slate-500">Staff accounts with role-based permissions.</p>
        </div>
        <Link
          href="/dashboard/employees/add"
          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-semibold px-4 py-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Add New Employee
        </Link>
      </div>
      <TablePage
        title="Employees"
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        empty="No admin employees yet. Add one above."
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => `${r.f_name ?? ""} ${r.l_name ?? ""}`.trim() || "—" },
          { header: "Email", cell: (r) => r.email },
          { header: "Phone", cell: (r) => r.phone ?? "—" },
          { header: "Role", cell: (r) => roleName.get(r.role_id) ?? `#${r.role_id}` },
          { header: "Zone", cell: (r) => (r.zone_id != null ? (zoneName.get(r.zone_id) ?? `#${r.zone_id}`) : "All") },
          { header: "Joined", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <Link href={`/dashboard/employees/${r.id}/edit`} className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">Edit</Link>
                <DeleteButton basePath="/employees" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
