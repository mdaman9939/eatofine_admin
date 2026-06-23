import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { CreateForm } from "../../../components/CreateForm";

interface Cuisine {
  id: number;
  name: string;
  status: boolean;
  slug: string | null;
  created_at: string | null;
}

export default async function CuisinesPage() {
  const data = await adminFetch<{ cuisines: Cuisine[] }>("/admin/cuisines");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/cuisines"
          title="New cuisine"
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "image", label: "Image", type: "image", imageDir: "cuisine" },
          ]}
        />
      </div>
      <TablePage
        title="Cuisines"
        subtitle={`${data.cuisines.length} cuisines`}
        description="Manage the cuisine types (Indian, Chinese, etc.) used to tag restaurants — add, edit, enable/disable or delete them."
        rows={data.cuisines}
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
                <EditRecordButton basePath="/cuisines" id={r.id} title="Edit cuisine" values={r as unknown as Record<string, unknown>} fields={[
                  { name: "name", label: "Name" },
                ]} />
                <ToggleStatusButton basePath="/cuisines" id={r.id} currentStatus={r.status} mode="base-path" />
                <DeleteButton basePath="/cuisines" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
