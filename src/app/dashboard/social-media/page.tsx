import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface S {
  id: number;
  name: string;
  link: string;
  status: boolean;
}

export default async function SocialMediaPage() {
  const data = await adminFetch<{ social_media: S[] }>("/admin/social-media");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/social-media"
          title="New social link"
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Facebook" },
            { name: "link", label: "URL", required: true, placeholder: "https://…" },
          ]}
        />
      </div>
      <TablePage
        title="Social media"
        subtitle={`${data.social_media.length} links`}
        rows={data.social_media}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.name },
          { header: "Link", cell: (r) => <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline text-xs">{r.link}</a> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <ToggleStatusButton basePath="/social-media" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/social-media" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
