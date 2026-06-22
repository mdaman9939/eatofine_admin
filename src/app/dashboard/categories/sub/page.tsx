import { adminFetch } from "../../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../../components/ActionButton";
import { EditRecordButton } from "../../../../components/EditRecordButton";
import { CreateForm } from "../../../../components/CreateForm";

interface Category {
  id: number;
  name: string;
  parent_id: number;
  position: number;
  priority: number;
  status: boolean;
  created_at: string | null;
}

// Sub-categories only (StackFood's "Sub Category Setup"). Each one is tied to a
// top-level "Main Category" via parent_id.
export default async function SubCategoriesPage() {
  const [all, parents] = await Promise.all([
    adminFetch<{ categories: Category[] }>("/admin/categories"),
    adminFetch<{ categories: Category[] }>("/admin/categories?parent_id=0"),
  ]);
  const subs = all.categories.filter((c) => c.parent_id);
  const parentNameById = new Map(parents.categories.map((c) => [c.id, c.name]));
  const parentOptions = parents.categories.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/categories"
          title="New sub-category"
          fields={[
            // Main Category is required — that's what makes this a sub-category.
            { name: "parent_id", label: "Main category", type: "select", options: parentOptions, required: true },
            { name: "name", label: "Sub-category name (default)", required: true },
            { name: "translations", label: "Name in other languages", type: "multilang", langKey: "name" },
            { name: "image", label: "Image", type: "image", imageDir: "category" },
            { name: "position", label: "Position", type: "number" },
            { name: "priority", label: "Priority", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Sub Category"
        subtitle={`${subs.length} sub-categories`}
        rows={subs}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Sub-category", cell: (r) => <span className="font-semibold">{r.name}</span> },
          {
            header: "Main category",
            cell: (r) => (
              <span className="text-xs text-slate-500">{parentNameById.get(r.parent_id) ?? `#${r.parent_id}`}</span>
            ),
          },
          { header: "Priority", cell: (r) => r.priority },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <EditRecordButton
                  basePath="/categories"
                  id={r.id}
                  title="Edit sub-category"
                  values={r as unknown as Record<string, unknown>}
                  fields={[
                    { name: "name", label: "Sub-category name" },
                    { name: "parent_id", label: "Main category", type: "select", options: parentOptions },
                    { name: "priority", label: "Priority", type: "number" },
                    { name: "position", label: "Position", type: "number" },
                  ]}
                />
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
