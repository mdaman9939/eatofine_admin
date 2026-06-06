import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";
import { DeleteButton } from "../../../components/ActionButton";
import { RolePermissionForm } from "../../../components/RolePermissionForm";
import { parseModules } from "../../../lib/roleModules";

interface R {
  id: number;
  name: string;
  modules: string | null;
  status: boolean;
}

export default async function AdminRolesPage() {
  const data = await adminFetch<{ roles: R[] }>("/admin/admin-roles");
  return (
    <>
      <div className="px-8 pt-8">
        <h1 className="text-2xl font-semibold mb-1">Admin roles</h1>
        <p className="text-sm text-slate-500 mb-4">
          Create roles and tick exactly which modules each role can access — just like the Laravel custom-role screen.
        </p>
        <RolePermissionForm mode="create" />
      </div>
      <TablePage
        title="Admin roles"
        subtitle={`${data.roles.length} roles`}
        rows={data.roles}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.name },
          {
            header: "Permissions",
            cell: (r) => {
              const count = parseModules(r.modules).length;
              return <span className="text-xs font-semibold text-slate-600">{count} module{count === 1 ? "" : "s"}</span>;
            },
          },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <div className="inline-flex items-center gap-2">
                <Link
                  href={`/dashboard/admin-roles/${r.id}/edit`}
                  className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  Edit
                </Link>
                <DeleteButton basePath="/admin-roles" id={r.id} />
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
