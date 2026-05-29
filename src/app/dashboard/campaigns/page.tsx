import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Campaign {
  id: number;
  title: string | null;
  description: string | null;
  status: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

export default async function CampaignsPage() {
  const data = await adminFetch<{ total: number; items: Campaign[] }>("/admin/campaigns");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/campaigns"
          title="New campaign"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "start_date", label: "Starts", type: "date" },
            { name: "end_date", label: "Ends", type: "date" },
          ]}
        />
      </div>
      <TablePage
        title="Campaigns"
        subtitle={`${data.items.length} of ${data.total}`}
        rows={data.items}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <ToggleStatusButton basePath="/campaigns" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/campaigns" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
