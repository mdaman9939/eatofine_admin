import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
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

export default async function CategoriesPage() {
  // All categories for the list (so sub-categories show too) + top-level for
  // the "Parent category" dropdown that turns a new category into a sub-category.
  const [all, parents] = await Promise.all([
    adminFetch<{ categories: Category[] }>("/admin/categories"),
    adminFetch<{ categories: Category[] }>("/admin/categories?parent_id=0"),
  ]);
  const parentNameById = new Map(parents.categories.map((c) => [c.id, c.name]));
  const parentOptions = parents.categories.map((c) => ({ value: String(c.id), label: c.name }));

  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/categories"
          title="New category / sub-category"
          fields={[
            { name: "name", label: "Name (default)", required: true },
            { name: "translations", label: "Name in other languages", type: "multilang", langKey: "name" },
            // Leave blank for a top-level category; pick a parent to make it a sub-category.
            { name: "parent_id", label: "Parent category (leave blank = top-level)", type: "select", options: parentOptions },
            { name: "image", label: "Image", type: "image", imageDir: "category" },
            { name: "position", label: "Position", type: "number" },
            { name: "priority", label: "Priority", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Categories"
        subtitle={`${all.categories.length} categories (incl. sub-categories)`}
        rows={all.categories}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          {
            header: "Name",
            cell: (r) =>
              r.parent_id ? (
                <span className="pl-4 text-slate-600">↳ {r.name}</span>
              ) : (
                <span className="font-semibold">{r.name}</span>
              ),
          },
          {
            header: "Type",
            cell: (r) =>
              r.parent_id ? (
                <span className="text-xs text-slate-500">Sub of <span className="font-medium">{parentNameById.get(r.parent_id) ?? `#${r.parent_id}`}</span></span>
              ) : (
                <span className="text-xs font-semibold text-emerald-700">Top-level</span>
              ),
          },
          { header: "Priority", cell: (r) => r.priority },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
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
