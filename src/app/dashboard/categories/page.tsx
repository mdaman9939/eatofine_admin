import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";
import { CreateForm } from "../../../components/CreateForm";

interface Category {
  id: number;
  name: string;
  parent_id: number;
  position: number;
  priority: number;
  status: boolean;
  created_at: string | null;
}

// Top-level categories only (StackFood's "Category" page). Sub-categories live
// on /dashboard/categories/sub.
export default async function CategoriesPage() {
  const top = await adminFetch<{ categories: Category[] }>("/admin/categories?parent_id=0");

  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/categories"
          title="New category"
          fields={[
            { name: "name", label: "Name (default)", required: true },
            { name: "translations", label: "Name in other languages", type: "multilang", langKey: "name" },
            { name: "image", label: "Image", type: "image", imageDir: "category" },
            { name: "position", label: "Position", type: "number" },
            { name: "priority", label: "Priority", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Category"
        subtitle={`${top.categories.length} top-level categories`}
        rows={top.categories}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
          { header: "Priority", cell: (r) => r.priority },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <EditRecordButton basePath="/categories" id={r.id} title="Edit category" values={r as unknown as Record<string, unknown>} fields={[
                  { name: "name", label: "Name" },
                  { name: "priority", label: "Priority", type: "number" },
                ]} />
                <ToggleStatusButton basePath="/categories" id={r.id} currentStatus={r.status} mode="base-path" />
                <DeleteButton basePath="/categories" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
