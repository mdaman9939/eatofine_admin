import Link from "next/link";
import { adminFetch } from "../../../lib/api";

interface FileEntry {
  name: string;
  folder: string;
  size_bytes: number;
  url: string;
  modified: string | null;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

function isImage(name: string): boolean {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(name);
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const sp = await searchParams;
  const folder = sp.folder ?? undefined;
  const data = await adminFetch<{
    total: number;
    folders: Array<{ name: string; count: number }>;
    files: FileEntry[];
  }>(`/admin/gallery${folder ? `?folder=${folder}` : ""}`);
  const totalBytes = data.files.reduce((s, f) => s + f.size_bytes, 0);

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SYSTEM · MEDIA
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Gallery / File Manager</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Browse files served from <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px] font-mono">storage/app/public</code>. Filter by folder.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total files" value={data.total.toString()} accent="emerald" />
        <StatTile label="Storage used" value={fmtSize(totalBytes)} accent="blue" />
        <StatTile label="Folders" value={data.folders.length.toString()} accent="amber" />
        <StatTile label="Current folder" value={folder ?? "All"} accent="slate" />
      </div>

      {/* Folder filter */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/dashboard/gallery"
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!folder ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
        >
          All ({data.total})
        </Link>
        {data.folders.map((f) => (
          <Link
            key={f.name}
            href={`/dashboard/gallery?folder=${f.name}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${folder === f.name ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            {f.name} ({f.count})
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Files</h2>
          <p className="text-xs text-slate-500 mt-0.5">{data.files.length} file(s) shown.</p>
        </div>
        {data.files.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">No files in this folder.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
            {data.files.map((f) => (
              <a
                key={`${f.folder}/${f.name}`}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="group bg-slate-50 hover:bg-emerald-50 rounded-xl border border-slate-200 hover:border-emerald-300 p-2 transition-all"
              >
                <div className="aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center mb-2">
                  {isImage(f.name) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                </div>
                <div className="text-xs font-medium text-slate-900 truncate" title={f.name}>{f.name}</div>
                <div className="text-[10px] text-slate-500 flex justify-between mt-1">
                  <span>{fmtSize(f.size_bytes)}</span>
                  <span>{fmtDate(f.modified)}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: "emerald" | "blue" | "amber" | "slate" }) {
  const palette: Record<string, string> = {
    emerald: "from-emerald-50/60 ring-emerald-200",
    blue: "from-blue-50/60 ring-blue-200",
    amber: "from-amber-50/60 ring-amber-200",
    slate: "from-slate-50/60 ring-slate-200",
  };
  return (
    <div className={`bg-gradient-to-b ${palette[accent]} to-white rounded-2xl border border-slate-200 shadow-sm p-5`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}
