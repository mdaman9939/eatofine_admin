import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtMoney } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface AddOn {
  id: number;
  name: string | null;
  price: number;
  status: boolean;
  restaurant_id: number;
  addon_category_id: number | null;
  stock_type: string;
  addon_stock: number;
  sell_count: number;
}

export default async function AddOnsPage() {
  const data = await adminFetch<{ total: number; items: AddOn[] }>("/admin/add-ons?limit=200");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/add-ons"
          title="New add-on"
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "price", label: "Price", type: "number", required: true },
            { name: "restaurant_id", label: "Restaurant ID", type: "number", required: true },
            { name: "addon_category_id", label: "Addon category ID", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Add-ons"
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.name ?? "—" },
          { header: "Price", cell: (r) => fmtMoney(r.price) },
          { header: "Restaurant", cell: (r) => `#${r.restaurant_id}` },
          { header: "Category", cell: (r) => r.addon_category_id ? `#${r.addon_category_id}` : "—" },
          { header: "Sold", cell: (r) => r.sell_count },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <ToggleStatusButton basePath="/add-ons" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/add-ons" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
