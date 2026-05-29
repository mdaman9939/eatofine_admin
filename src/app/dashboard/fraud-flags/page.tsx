import { adminFetch } from "../../../lib/api";
import { CreateForm } from "../../../components/CreateForm";
import { PaginatedTable } from "../../../components/PaginatedTable";
import { DonutChart, DonutLegend, DONUT_PALETTE } from "../../../components/DonutChart";
import { FraudFlagResolver } from "../../../components/FraudFlagResolver";

type Severity = "low" | "medium" | "high" | "critical";
type FlagStatus = "open" | "investigating" | "resolved" | "dismissed";
type SubjectType = "customer" | "vendor" | "delivery_man";

interface FraudFlag {
  id: number;
  subject_type: SubjectType;
  subject_id: number;
  subject_name: string | null;
  flag_type: string;
  severity: Severity;
  description: string | null;
  auto_triggered: boolean | null;
  status: FlagStatus;
  flagged_by: number | null;
  resolved_by: number | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string | null;
}

interface FlagStats {
  total: number;
  byStatus: { open: number; investigating: number; resolved: number; dismissed: number };
  bySeverity: { low: number; medium: number; high: number; critical: number };
}

const SUBJECT_LABEL: Record<SubjectType, string> = {
  customer: "Customer",
  vendor: "Vendor",
  delivery_man: "Rider",
};

const SUBJECT_TILE: Record<SubjectType, string> = {
  customer: "bg-sky-50 text-sky-700 border-sky-200",
  vendor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivery_man: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const SEVERITY_CHIP: Record<Severity, string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  high: "bg-amber-50 text-amber-700 border-amber-200",
  medium: "bg-teal-50 text-teal-700 border-teal-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

const SEVERITY_DOT: Record<Severity, string> = {
  critical: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]",
  high: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
  medium: "bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.6)]",
  low: "bg-slate-400",
};

const STATUS_CHIP: Record<FlagStatus, string> = {
  open: "bg-rose-50 text-rose-700 border-rose-200",
  investigating: "bg-amber-50 text-amber-700 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  dismissed: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_DOT: Record<FlagStatus, string> = {
  open: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]",
  investigating: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
  resolved: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
  dismissed: "bg-slate-400",
};

const VALID_STATUSES: FlagStatus[] = ["open", "investigating", "resolved", "dismissed"];

export default async function FraudFlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const rawStatus = sp.status ?? "";
  const statusFilter = (VALID_STATUSES as string[]).includes(rawStatus) ? (rawStatus as FlagStatus) : "";
  const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";

  const [flags, stats] = await Promise.all([
    adminFetch<FraudFlag[]>(`/admin/fraud-flags${qs}`),
    adminFetch<FlagStats>("/admin/fraud-flags/stats"),
  ]);

  const slices = [
    { label: "Critical", value: stats.bySeverity.critical, color: DONUT_PALETTE.rose },
    { label: "High", value: stats.bySeverity.high, color: DONUT_PALETTE.amber },
    { label: "Medium", value: stats.bySeverity.medium, color: DONUT_PALETTE.teal },
    { label: "Low", value: stats.bySeverity.low, color: DONUT_PALETTE.slate },
  ].filter((s) => s.value > 0);

  const severityTotal =
    stats.bySeverity.critical + stats.bySeverity.high + stats.bySeverity.medium + stats.bySeverity.low;

  const headerRow = (
    <tr>
      <th className="px-4 py-3 font-semibold w-14">#</th>
      <th className="px-4 py-3 font-semibold">Subject</th>
      <th className="px-4 py-3 font-semibold">Flag type</th>
      <th className="px-4 py-3 font-semibold">Severity</th>
      <th className="px-4 py-3 font-semibold">Description</th>
      <th className="px-4 py-3 font-semibold">Status</th>
      <th className="px-4 py-3 font-semibold">Source</th>
      <th className="px-4 py-3 font-semibold">Created</th>
      <th className="px-4 py-3 font-semibold text-right">Actions</th>
    </tr>
  );

  const bodyRows = flags.map((f) => (
    <tr key={f.id} className="hover:bg-emerald-50/40 transition-colors align-top">
      <td className="px-4 py-3 font-mono text-xs text-slate-400 w-14">#{f.id}</td>

      <td className="px-4 py-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 mt-0.5 ${
              SUBJECT_TILE[f.subject_type] ?? "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {SUBJECT_LABEL[f.subject_type] ?? f.subject_type}
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate max-w-[200px]">
              {f.subject_name ?? `#${f.subject_id}`}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">#{f.subject_id}</div>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <code className="inline-block max-w-[180px] truncate font-mono text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded px-2 py-0.5">
          {f.flag_type}
        </code>
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${SEVERITY_CHIP[f.severity]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[f.severity]}`} />
          {f.severity}
        </span>
      </td>

      <td className="px-4 py-3">
        <div className="text-xs text-slate-600 truncate max-w-[260px]" title={f.description ?? undefined}>
          {f.description ?? <span className="text-slate-400 italic">No description</span>}
        </div>
        {f.resolution_notes && (f.status === "resolved" || f.status === "dismissed") && (
          <div
            className="text-[11px] text-slate-500 italic truncate max-w-[260px] mt-0.5"
            title={f.resolution_notes}
          >
            &ldquo;{f.resolution_notes}&rdquo;
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${STATUS_CHIP[f.status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[f.status]}`} />
          {f.status}
        </span>
      </td>

      <td className="px-4 py-3">
        {f.auto_triggered ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200"
            title="Automatically triggered by the system"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Auto
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200"
            title="Manually raised by an admin"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Manual
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
        {f.created_at ? new Date(f.created_at).toLocaleDateString() : "—"}
      </td>

      <td className="px-4 py-3 text-right">
        <FraudFlagResolver id={f.id} status={f.status} />
      </td>
    </tr>
  ));

  const searchTexts = flags.map((f) =>
    `${f.subject_name ?? ""} ${f.subject_type} ${f.subject_id} ${f.flag_type} ${f.severity} ${f.status} ${
      f.description ?? ""
    }`.toLowerCase()
  );

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-56 h-56 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" />
              Compliance · Risk monitoring
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Fraud &amp; misuse flags</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Flags raised against customers, vendors and riders — manually by admins or automatically when
              rejection limits or other thresholds are hit. Investigate and resolve here.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur-sm px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300 shadow-[0_0_6px_rgba(253,164,175,0.7)]" />
              <span className="text-[11px] uppercase tracking-wider text-white/80 font-semibold">
                {stats.byStatus.open.toLocaleString("en-IN")} open
              </span>
              <span className="text-white/40">·</span>
              <span className="text-[11px] uppercase tracking-wider text-white/70 font-semibold">
                {stats.total.toLocaleString("en-IN")} total
              </span>
            </div>
          </div>
          <CreateForm
            path="/fraud-flags"
            title="Raise manual flag"
            submitLabel="Raise flag"
            fields={[
              {
                name: "subject_type",
                label: "Subject type",
                type: "select",
                required: true,
                defaultValue: "customer",
                options: [
                  { value: "customer", label: "Customer" },
                  { value: "vendor", label: "Vendor" },
                  { value: "delivery_man", label: "Delivery man" },
                ],
              },
              { name: "subject_id", label: "Subject ID", type: "number", required: true, placeholder: "e.g. 1024" },
              {
                name: "flag_type",
                label: "Flag type",
                required: true,
                placeholder: "e.g. excessive_rejections, payment_fraud, abusive_behaviour",
              },
              {
                name: "severity",
                label: "Severity",
                type: "select",
                defaultValue: "medium",
                options: [
                  { value: "low", label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high", label: "High" },
                  { value: "critical", label: "Critical" },
                ],
              },
              { name: "description", label: "Description", type: "textarea", placeholder: "What did the subject do, and how did you confirm it?" },
            ]}
          />
        </div>
      </div>

      {/* ── Severity stat cards ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Critical"
          value={stats.bySeverity.critical}
          suffix="immediate attention"
          accent="rose"
        />
        <StatCard
          label="High"
          value={stats.bySeverity.high}
          suffix="elevated risk"
          accent="amber"
        />
        <StatCard
          label="Medium"
          value={stats.bySeverity.medium}
          suffix="review when able"
          accent="teal"
        />
        <StatCard
          label="Low"
          value={stats.bySeverity.low}
          suffix="informational"
          accent="slate"
        />
      </div>

      {/* ── Sidebar + table ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900">Severity split</h3>
          <p className="text-xs text-slate-500 mt-0.5">All flags by severity.</p>
          <div className="mt-4 flex justify-center">
            <DonutChart slices={slices} centerLabel="Flags" centerValue={severityTotal} />
          </div>
          <div className="mt-5">
            <DonutLegend slices={slices} />
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
              Filter by status
            </div>
            <FilterLink href="/dashboard/fraud-flags" label="All" active={!statusFilter} count={stats.total} />
            <FilterLink
              href="/dashboard/fraud-flags?status=open"
              label="Open"
              active={statusFilter === "open"}
              count={stats.byStatus.open}
            />
            <FilterLink
              href="/dashboard/fraud-flags?status=investigating"
              label="Investigating"
              active={statusFilter === "investigating"}
              count={stats.byStatus.investigating}
            />
            <FilterLink
              href="/dashboard/fraud-flags?status=resolved"
              label="Resolved"
              active={statusFilter === "resolved"}
              count={stats.byStatus.resolved}
            />
            <FilterLink
              href="/dashboard/fraud-flags?status=dismissed"
              label="Dismissed"
              active={statusFilter === "dismissed"}
              count={stats.byStatus.dismissed}
            />
          </div>
        </div>

        <PaginatedTable
          headerRow={headerRow}
          bodyRows={bodyRows}
          searchTexts={searchTexts}
          pageSize={10}
          searchable
          colCount={9}
          empty={
            statusFilter
              ? `No fraud flags with status "${statusFilter}".`
              : "No fraud flags raised yet — automated checks and manual reports will show up here."
          }
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: "rose" | "amber" | "teal" | "slate";
}) {
  const bg: Record<string, string> = {
    rose: "from-rose-50/70 to-white",
    amber: "from-amber-50/70 to-white",
    teal: "from-teal-50/70 to-white",
    slate: "from-slate-50/70 to-white",
  };
  const dot: Record<string, string> = {
    rose: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]",
    amber: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    teal: "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]",
    slate: "bg-slate-400",
  };
  const labelColor: Record<string, string> = {
    rose: "text-rose-700",
    amber: "text-amber-700",
    teal: "text-teal-700",
    slate: "text-slate-600",
  };
  return (
    <div
      className={`relative bg-gradient-to-b ${bg[accent]} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] uppercase tracking-wider font-semibold ${labelColor[accent]}`}>{label}</span>
        <span className={`w-2 h-2 rounded-full ${dot[accent]}`} />
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
        {value.toLocaleString("en-IN")}
      </div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}

function FilterLink({
  href,
  label,
  active,
  count,
}: {
  href: string;
  label: string;
  active?: boolean;
  count?: number;
}) {
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
