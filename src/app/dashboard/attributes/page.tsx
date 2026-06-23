import { adminFetch } from "../../../lib/api";
import { TablePage, fmtDate } from "../../../components/TablePage";
import { DeleteButton } from "../../../components/ActionButton";
import { InlineEditName } from "../../../components/InlineEditName";
import { CreateForm } from "../../../components/CreateForm";

interface Attribute {
  id: number;
  name: string | null;
  created_at: string | null;
}

export default async function AttributesPage() {
  const data = await adminFetch<{ attributes: Attribute[] }>("/admin/attributes");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm path="/attributes" title="New attribute" fields={[{ name: "name", label: "Name", required: true }]} />
      </div>
      <TablePage
        title="Attributes"
        subtitle={`${data.attributes.length} attributes`}
        description="Manage the attribute labels used to describe and tag food items — add, rename or delete them."
        rows={data.attributes}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.name ?? "—" },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          { header: "Actions", cell: (r) => (
            <span className="flex gap-2">
              <InlineEditName basePath="/attributes" id={r.id} value={r.name ?? ""} />
              <DeleteButton basePath="/attributes" id={r.id} />
            </span>
          ) },
        ]}
      />
    </>
  );
}
