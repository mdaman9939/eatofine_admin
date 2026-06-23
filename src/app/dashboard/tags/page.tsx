import { adminFetch } from "../../../lib/api";
import { TablePage } from "../../../components/TablePage";

interface Tag {
  id: number;
  tag: string | null;
  feature?: boolean;
}

export default async function TagsPage() {
  const data = await adminFetch<{ tags: Tag[] }>("/admin/tags");
  return (
    <TablePage
      title="Tags"
      subtitle={`${data.tags.length} tags`}
      description="View the keyword tags used to label food items and help customers search and filter dishes across the platform."
      rows={data.tags}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Tag", cell: (r) => r.tag ?? JSON.stringify(r) },
      ]}
    />
  );
}
