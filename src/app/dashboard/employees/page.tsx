import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";

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

export default async function EmployeesPage() {
  const data = await adminFetch<{ total: number; items: E[] }>("/admin/employees?limit=200");
  return (
    <TablePage
      title="Employees"
      subtitle={`${data.items.length} of ${data.total}`}
      rows={data.items}
      rowKey={(r) => r.id}
      empty="No admin employees yet. The root admin (role_id=1) is filtered out."
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Name", cell: (r) => `${r.f_name ?? ""} ${r.l_name ?? ""}`.trim() || "—" },
        { header: "Email", cell: (r) => r.email },
        { header: "Phone", cell: (r) => r.phone ?? "—" },
        { header: "Role", cell: (r) => `#${r.role_id}` },
        { header: "Zone", cell: (r) => r.zone_id ?? "—" },
        { header: "Joined", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
      ]}
    />
  );
}
