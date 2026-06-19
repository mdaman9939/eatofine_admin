import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";
import { EditRecordButton } from "../../../components/EditRecordButton";

interface DocCategory {
  id: number;
  name: string;
  target_role: "vendor" | "delivery_man" | "restaurant";
  allowed_formats: string;
  max_size_mb: number;
  is_mandatory: boolean;
  description: string | null;
  status: boolean;
  sort_order: number;
}

const ROLE_LABEL: Record<string, string> = {
  vendor: "Vendor",
  delivery_man: "Delivery partner",
  restaurant: "Restaurant",
};

const ROLE_CHIP: Record<string, string> = {
  vendor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivery_man: "bg-teal-50 text-teal-700 border-teal-200",
  restaurant: "bg-amber-50 text-amber-700 border-amber-200",
};

export default async function DocumentCategoriesPage() {
  const data = await adminFetch<DocCategory[]>("/admin/document-categories");
  const categories = data;

  const vendorCount = categories.filter((c) => c.target_role === "vendor").length;
  const dmCount = categories.filter((c) => c.target_role === "delivery_man").length;
  const mandatoryCount = categories.filter((c) => c.is_mandatory).length;
  const activeCount = categories.filter((c) => c.status).length;

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
              Compliance · Document master
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Document categories</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              The master list of documents collected from vendors and delivery partners during onboarding.
              Mandatory ones must be uploaded before onboarding is approved; non-mandatory ones are optional.
            </p>
          </div>
          <CreateForm
            path="/document-categories"
            title="New document category"
            fields={[
              { name: "name", label: "Category name", required: true, placeholder: "FSSAI License" },
              {
                name: "target_role",
                label: "Applies to",
                type: "select",
                required: true,
                defaultValue: "vendor",
                options: [
                  { value: "vendor", label: "Vendor" },
                  { value: "delivery_man", label: "Delivery partner" },
                  { value: "restaurant", label: "Restaurant" },
                ],
              },
              { name: "allowed_formats", label: "Allowed formats", placeholder: "pdf,jpg,jpeg,png", defaultValue: "pdf,jpg,jpeg,png" },
              { name: "max_size_mb", label: "Max size (MB)", type: "number", defaultValue: 5 },
              { name: "is_mandatory", label: "Mandatory document", type: "checkbox" },
              { name: "sort_order", label: "Display order", type: "number", defaultValue: 0 },
              { name: "description", label: "Helper text shown to user", type: "textarea", placeholder: "Optional — shown on the upload screen." },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total categories" value={categories.length.toString()} suffix={`${activeCount} active`} accent="emerald" />
        <StatCard label="Mandatory" value={mandatoryCount.toString()} suffix={`${categories.length - mandatoryCount} optional`} accent="teal" />
        <StatCard label="Vendor docs" value={vendorCount.toString()} suffix="restaurant owners" accent="emerald" />
        <StatCard label="Rider docs" value={dmCount.toString()} suffix="delivery partners" accent="teal" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Configured categories</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Disabling a category hides it from the onboarding upload screen without affecting documents already submitted.
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Document</th>
                <th className="px-4 py-3 font-semibold">Applies to</th>
                <th className="px-4 py-3 font-semibold">Formats</th>
                <th className="px-4 py-3 font-semibold text-right">Max size</th>
                <th className="px-4 py-3 font-semibold">Mandatory</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">#{c.id}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    {c.description && (
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 max-w-md">{c.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${ROLE_CHIP[c.target_role]}`}>
                      {ROLE_LABEL[c.target_role] ?? c.target_role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {c.allowed_formats.split(",").map((fmt) => (
                        <span key={fmt} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono uppercase">
                          {fmt.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-slate-800 tabular-nums">
                    {c.max_size_mb}<span className="text-[11px] text-slate-400 ml-0.5">MB</span>
                  </td>
                  <td className="px-4 py-4">
                    {c.is_mandatory ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {c.status ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <EditRecordButton basePath="/document-categories" id={c.id} title="Edit category" values={c as unknown as Record<string, unknown>} fields={[
                        { name: "name", label: "Category name", type: "text" },
                        { name: "target_role", label: "Applies to", type: "select", options: [
                          { value: "vendor", label: "Vendor" },
                          { value: "delivery_man", label: "Delivery partner" },
                          { value: "restaurant", label: "Restaurant" },
                        ] },
                        { name: "allowed_formats", label: "Allowed formats", type: "text" },
                        { name: "max_size_mb", label: "Max size (MB)", type: "number" },
                        { name: "is_mandatory", label: "Mandatory document", type: "checkbox" },
                        { name: "sort_order", label: "Display order", type: "number" },
                        { name: "description", label: "Helper text", type: "text" },
                      ]} />
                      <ToggleStatusButton basePath="/document-categories" id={c.id} currentStatus={c.status} />
                      <DeleteButton basePath="/document-categories" id={c.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <p className="text-sm font-medium">No document categories yet</p>
                      <p className="text-xs">Use the &quot;+ New document category&quot; button above to create the first one.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix, accent }: { label: string; value: string; suffix?: string; accent: "emerald" | "teal" }) {
  const bg = accent === "emerald" ? "from-emerald-50/60 to-white" : "from-teal-50/60 to-white";
  return (
    <div className={`relative bg-gradient-to-b ${bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}
