import { adminFetch } from "../../../lib/api";
import { TablePage } from "../../../components/TablePage";

interface T {
  id: number;
  key: string | null;
  value: string | null;
  locale: string | null;
}

export default async function TranslationsPage() {
  const data = await adminFetch<{ total: number; items: T[] }>("/admin/translations?limit=300");
  return (
    <TablePage
      title="Translations"
      subtitle={`${data.items.length} of ${data.total}`}
      description="Review the text labels used across the app in each language, so the platform reads correctly for every customer."
      rows={data.items}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Locale", cell: (r) => r.locale ?? "—" },
        { header: "Key", cell: (r) => <span className="font-mono text-xs">{r.key ?? "—"}</span> },
        { header: "Value", cell: (r) => r.value ?? "—" },
      ]}
    />
  );
}
