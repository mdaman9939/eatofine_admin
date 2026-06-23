import { adminFetch } from "../../../lib/api";
import { CreateForm } from "../../../components/CreateForm";
import { DeleteButton } from "../../../components/ActionButton";
import { EditRecordButton } from "../../../components/EditRecordButton";

interface Template {
  id: number;
  event: string;
  audience: string;
  subject: string;
  body: string;
  status: boolean;
  updated_at: string | null;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
}

export default async function EmailTemplatesPage() {
  const data = await adminFetch<{ total: number; items: Template[] }>("/admin/email-templates");
  const templates = data.items;
  const byAudience = (a: string) => templates.filter((t) => t.audience === a).length;

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7 flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
              <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> BUSINESS SETTINGS · EMAILS
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Email Templates</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Write and manage the automatic emails the platform sends for each event — set the subject and message customers, restaurants and delivery men receive.
            </p>
          </div>
          <CreateForm
            path="/email-templates"
            title="New template"
            fields={[
              { name: "event", label: "Event", type: "text", required: true, placeholder: "e.g. order_placed" },
              { name: "audience", label: "Audience", type: "select", options: [
                { value: "customer", label: "Customer" },
                { value: "vendor", label: "Vendor" },
                { value: "dm", label: "Delivery Man" },
                { value: "admin", label: "Admin" },
              ], defaultValue: "customer" },
              { name: "subject", label: "Subject", type: "text", required: true, placeholder: "Order #{{order_id}} confirmed" },
              { name: "body", label: "Body (HTML)", type: "textarea", placeholder: "<p>Hello {{customer_name}}, ...</p>" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total templates" value={templates.length.toString()} accent="emerald" />
        <StatTile label="Customer" value={byAudience("customer").toString()} accent="blue" />
        <StatTile label="Vendor" value={byAudience("vendor").toString()} accent="amber" />
        <StatTile label="DM" value={byAudience("dm").toString()} accent="slate" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">All templates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Audience</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {templates.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No templates yet.</td></tr>
              ) : templates.map((t) => (
                <tr key={t.id} className="hover:bg-emerald-50/40">
                  <td className="px-6 py-3 font-mono text-xs text-slate-400">#{t.id}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium font-mono text-xs">{t.event}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">{t.audience}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 text-sm max-w-md truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(t.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex gap-2 justify-end">
                      <EditRecordButton basePath="/email-templates" id={t.id} title="Edit template" values={t as unknown as Record<string, unknown>} fields={[
                        { name: "subject", label: "Subject" },
                        { name: "body", label: "Body" },
                      ]} />
                      <DeleteButton basePath="/email-templates" id={t.id} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
