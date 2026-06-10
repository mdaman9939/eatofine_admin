import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { BulkImportPanel } from "../../../../components/BulkImportPanel";

interface ExportRow {
  id: number;
  name: string;
  parent_id: number;
  position: number;
  priority: number;
  status: number;
}

function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "id,name,parent_id,position,priority,status";
  const headers = Object.keys(rows[0]).join(",");
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((v) => {
          const s = v === null || v === undefined ? "" : String(v);
          return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
  return `${headers}\n${body}`;
}

export default async function CategoriesBulkPage() {
  const data = await adminFetch<{ total: number; rows: ExportRow[] }>("/admin/categories/bulk-export");
  const csv = toCsv(data.rows);

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <Link href="/dashboard/categories" className="text-sm text-blue-600 hover:underline">← Category</Link>

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> FOOD MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Bulk Import / Export — Categories</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Upload many categories from CSV, or download all categories for backup / external editing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">⬆ Bulk import</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Required header: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">name</code>. Optional:{" "}
            <code className="font-mono text-[10px]">parent_id, position, priority</code>. Set{" "}
            <code className="font-mono text-[10px]">parent_id</code> to a top-level category id to make a sub-category (blank/0 = top-level).
          </p>
          <BulkImportPanel endpoint="/categories/bulk-import" requiredHeader="name" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">⬇ Bulk export</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">{data.total} categories.</p>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="categories.csv"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-5 py-2.5"
          >
            ⬇ Download CSV ({data.total} rows)
          </a>
        </div>
      </div>
    </div>
  );
}
