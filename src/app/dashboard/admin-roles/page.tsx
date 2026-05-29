import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";
import { DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

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
        <CreateForm
          path="/admin-roles"
          title="New admin role"
          fields={[
            { name: "name", label: "Role name", required: true },
            { name: "modules", label: "Modules (JSON)", type: "textarea", placeholder: '["orders","restaurants"]' },
          ]}
        />
      </div>
      <TablePage
        title="Admin roles"
        subtitle={`${data.roles.length} roles`}
        rows={data.roles}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.name },
          { header: "Modules", cell: (r) => <span className="text-xs font-mono">{r.modules ?? "—"}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          { header: "Actions", cell: (r) => <DeleteButton basePath="/admin-roles" id={r.id} /> },
        ]}
      />
    </>
  );
}
