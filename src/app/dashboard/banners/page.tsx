import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Banner {
  id: number;
  title: string;
  type: string;
  image: string | null;
  status: boolean;
  zone_id: number;
  created_at: string | null;
}

export default async function BannersPage() {
  const data = await adminFetch<{ banners: Banner[] }>("/admin/banners");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/banners"
          title="New banner"
          fields={[
            { name: "title", label: "Title", required: true },
            {
              name: "type",
              label: "Type",
              type: "select",
              required: true,
              options: [
                { value: "promotional", label: "promotional" },
                { value: "restaurant_wise", label: "restaurant_wise" },
                { value: "food_wise", label: "food_wise" },
                { value: "default", label: "default" },
              ],
            },
            { name: "zone_id", label: "Zone ID", type: "number", required: true, defaultValue: 1 },
            { name: "image", label: "Banner image", type: "image", imageDir: "banner" },
            { name: "data", label: "Data (linked id, or JSON)", placeholder: "e.g. 2 for restaurant_wise" },
          ]}
        />
      </div>
      <TablePage
        title="Banners"
        subtitle={`${data.banners.length} banners`}
        rows={data.banners}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title },
          { header: "Type", cell: (r) => <span className="text-xs uppercase">{r.type}</span> },
          { header: "Zone", cell: (r) => r.zone_id },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          { header: "Created", cell: (r) => <span className="text-xs text-zinc-500">{fmtDate(r.created_at)}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <ToggleStatusButton basePath="/banners" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/banners" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
