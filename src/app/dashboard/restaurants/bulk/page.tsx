import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { BulkImportPanel } from "../../../../components/BulkImportPanel";

interface ExportRow {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  minimum_order: number;
  zone_id: string | number;
  status: string;
}

function toCsv(rows: ExportRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).map((v) => {
    const s = v === null || v === undefined ? "" : String(v);
    return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  return `${headers}\n${body}`;
}

export default async function RestaurantBulkPage() {
  const data = await adminFetch<{ total: number; rows: ExportRow[] }>("/admin/restaurants/bulk-export");
  const csv = toCsv(data.rows);
  const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="relative p-8 space-y-6 max-w-5xl">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <Link href="/dashboard/restaurants" className="text-sm text-blue-600 hover:underline">← All restaurants</Link>

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> RESTAURANT MANAGEMENT
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Bulk Import / Export</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Upload many restaurants from a CSV, or download the current list for backup / external editing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">⬆ Bulk import</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Paste CSV content. Header row must include <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">name</code>. Optional columns: <code className="font-mono text-[10px]">email, phone, address, minimum_order, zone_id</code>.
          </p>
          <BulkImportPanel endpoint="/restaurants/bulk-import" requiredHeader="name" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">⬇ Bulk export</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {data.total} restaurants. Download includes id, name, email, phone, address, minimum_order, zone_id, status.
          </p>
          <a
            href={csvDataUri}
            download="restaurants.csv"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white text-sm font-semibold px-5 py-2.5 shadow-sm hover:shadow"
          >
            ⬇ Download CSV ({data.total} rows)
          </a>
          <details className="mt-4">
            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Preview first 5 rows</summary>
            <pre className="mt-2 text-[10px] font-mono bg-slate-50 border border-slate-200 rounded p-3 overflow-x-auto max-h-64">
{csv.split("\n").slice(0, 6).join("\n")}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
