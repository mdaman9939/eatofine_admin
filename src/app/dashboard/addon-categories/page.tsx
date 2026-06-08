import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { InlineEditName } from "../../../components/InlineEditName";
import { CreateForm } from "../../../components/CreateForm";

interface AddonCategory {
  id: number;
  name: string;
  status: boolean;
  slug: string | null;
  created_at: string | null;
}

export default async function AddonCategoriesPage() {
  const data = await adminFetch<{ total: number; items: AddonCategory[] }>("/admin/addon-categories");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm path="/addon-categories" title="New addon category" fields={[{ name: "name", label: "Name", required: true }]} />
      </div>
      <TablePage
        title="Addon categories"
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.name },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <InlineEditName basePath="/addon-categories" id={r.id} value={r.name} />
                <ToggleStatusButton basePath="/addon-categories" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/addon-categories" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
