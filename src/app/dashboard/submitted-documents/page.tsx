import { adminFetch } from "../../../lib/api";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DocumentReviewActions } from "../../../components/DocumentReviewActions";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";

interface SubmittedDoc {
  id: number;
  category_id: number;
  category_name: string | null;
  is_mandatory: boolean | null;
  owner_type: "vendor" | "delivery_man" | "restaurant";
  owner_id: number;
  owner_name: string | null;
  file_path: string;
  original_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: "pending" | "approved" | "rejected";
  remarks: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface DocStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// Resolve the backend's storage origin from the same env var the API base
// URL uses (strip the `/api/v1` suffix). Falls back to localhost for dev.
function resolveStorageBase(): string {
  const api = process.env.NEXT_PUBLIC_API_BASE_URL
    ?? process.env.NODE_API_URL
    ?? "http://127.0.0.1:3000/api/v1";
  return api.replace(/\/api\/v1\/?$/, "") + "/storage/document/";
}
const STORAGE_BASE = resolveStorageBase();

const OWNER_LABEL: Record<string, string> = {
  vendor: "Vendor",
  delivery_man: "Rider",
  restaurant: "Restaurant",
};

const STATUS_CHIP: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default async function SubmittedDocumentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const statusFilter = sp.status ?? "";
  const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";

  const [docs, stats] = await Promise.all([
    adminFetch<SubmittedDoc[]>(`/admin/submitted-documents${qs}`),
    adminFetch<DocStats>("/admin/submitted-documents/stats"),
  ]);

  const slices = [
    { label: "Pending", value: stats.pending, color: DONUT_PALETTE.amber },
    { label: "Approved", value: stats.approved, color: DONUT_PALETTE.emerald },
    { label: "Rejected", value: stats.rejected, color: DONUT_PALETTE.rose },
  ].filter((s) => s.value > 0);

  const headerRow = (
    <tr>
      <th className="px-4 py-3 font-semibold w-16">#</th>
      <th className="px-4 py-3 font-semibold">Document</th>
      <th className="px-4 py-3 font-semibold">Submitted by</th>
      <th className="px-4 py-3 font-semibold">File</th>
      <th className="px-4 py-3 font-semibold">Status</th>
      <th className="px-4 py-3 font-semibold">Submitted</th>
      <th className="px-4 py-3 font-semibold text-right">Actions</th>
    </tr>
  );

  const bodyRows = docs.map((d) => (
    <tr key={d.id} className="hover:bg-emerald-50/40 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-slate-400 w-16">#{d.id}</td>
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center shadow-sm shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{d.category_name ?? "—"}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {d.is_mandatory && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                  Mandatory
                </span>
              )}
              {d.remarks && d.status !== "pending" && (
                <span className="text-[11px] text-slate-500 italic truncate max-w-xs">&ldquo;{d.remarks}&rdquo;</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{d.owner_name ?? `#${d.owner_id}`}</div>
        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{OWNER_LABEL[d.owner_type] ?? d.owner_type}</div>
      </td>
      <td className="px-4 py-3">
        <a
          href={`${STORAGE_BASE}${d.file_path}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="truncate max-w-[140px]">{d.original_name ?? "Open"}</span>
        </a>
        <div className="text-[10px] text-slate-400 mt-0.5">{formatBytes(d.file_size_bytes)}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_CHIP[d.status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            d.status === "approved" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
            : d.status === "rejected" ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"
            : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]"
          }`} />
          {d.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
      </td>
      <td className="px-4 py-3 text-right">
        <DocumentReviewActions id={d.id} status={d.status} />
      </td>
    </tr>
  ));

  const searchTexts = docs.map((d) =>
    `${d.category_name ?? ""} ${d.owner_name ?? ""} ${d.owner_type} ${d.original_name ?? ""} ${d.status}`.toLowerCase()
  );

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Compliance · Verification queue
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Submitted documents</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Documents uploaded by vendors and delivery partners awaiting verification. Approve to clear them
              for onboarding, or reject with remarks so the user knows what to fix.
            </p>
          </div>
          <div className="rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Queue</div>
            <div className="text-lg font-bold tabular-nums">{stats.total.toLocaleString("en-IN")}</div>
            <div className="text-[11px] text-white/70">{stats.pending} pending review</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending" value={stats.pending} suffix="awaiting review" accent="amber" href="/dashboard/submitted-documents?status=pending" />
        <StatCard label="Approved" value={stats.approved} suffix={stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% of all` : "—"} accent="emerald" href="/dashboard/submitted-documents?status=approved" />
        <StatCard label="Rejected" value={stats.rejected} suffix="need re-upload" accent="rose" href="/dashboard/submitted-documents?status=rejected" />
        <StatCard label="Total" value={stats.total} suffix="all-time" accent="teal" href="/dashboard/submitted-documents" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Review status</h3>
          <p className="text-xs text-slate-500 mt-0.5">All submitted documents.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Documents" centerValue={stats.total} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Filter</div>
            <FilterLink href="/dashboard/submitted-documents" label="All" active={!statusFilter} />
            <FilterLink href="/dashboard/submitted-documents?status=pending" label="Pending" active={statusFilter === "pending"} count={stats.pending} />
            <FilterLink href="/dashboard/submitted-documents?status=approved" label="Approved" active={statusFilter === "approved"} count={stats.approved} />
            <FilterLink href="/dashboard/submitted-documents?status=rejected" label="Rejected" active={statusFilter === "rejected"} count={stats.rejected} />
          </div>
        </div>

        <PaginatedTable
          headerRow={headerRow}
          bodyRows={bodyRows}
          searchTexts={searchTexts}
          pageSize={10}
          searchable
          colCount={7}
          empty={statusFilter ? `No documents with status "${statusFilter}".` : "No documents submitted yet."}
        />
      </div>
    </div>
  );
}

function StatCard({
  label, value, suffix, accent, href,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: "emerald" | "teal" | "amber" | "rose";
  href?: string;
}) {
  const bg: Record<string, string> = {
    emerald: "from-emerald-50/60 to-white",
    teal: "from-teal-50/60 to-white",
    amber: "from-amber-50/60 to-white",
    rose: "from-rose-50/60 to-white",
  };
  const inner = (
    <>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value.toLocaleString("en-IN")}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </>
  );
  const cls = `relative bg-gradient-to-b ${bg[accent]} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`;
  if (href) return <a href={href} className={cls + " block cursor-pointer"}>{inner}</a>;
  return <div className={cls}>{inner}</div>;
}

function FilterLink({ href, label, active, count }: { href: string; label: string; active?: boolean; count?: number }) {
  return (
    <a
      href={href}
      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
        active
          ? "bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-xs tabular-nums ${active ? "text-emerald-600" : "text-slate-400"}`}>{count}</span>
      )}
    </a>
  );
}
