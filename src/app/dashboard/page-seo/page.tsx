import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge } from "../../../components/TablePage";
import { CreateForm } from "../../../components/CreateForm";

interface PS {
  id: number;
  page_name: string;
  title: string;
  description: string;
  slug: string | null;
  status: boolean;
}

export default async function PageSeoPage() {
  const data = await adminFetch<{ pages: PS[] }>("/admin/page-seo");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/page-seo"
          title="Upsert SEO entry"
          fields={[
            { name: "page_name", label: "Page name", required: true, placeholder: "home / about / privacy" },
            { name: "title", label: "Title", required: true },
            { name: "description", label: "Description", type: "textarea", required: true },
          ]}
        />
      </div>
      <TablePage
        title="Page SEO"
        subtitle={`${data.pages.length} pages`}
        description="Set the search-engine title and description shown for each website page (home, about, privacy and more) so they appear well in Google results."
        rows={data.pages}
        rowKey={(r) => r.id}
        columns={[
          { header: "Page", cell: (r) => <span className="font-medium">{r.page_name}</span> },
          { header: "Title", cell: (r) => r.title },
          { header: "Description", cell: (r) => <span className="text-xs text-zinc-500">{r.description.slice(0, 80)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
        ]}
      />
    </>
  );
}
