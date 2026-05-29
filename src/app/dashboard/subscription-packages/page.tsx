import { adminFetch } from "../../../lib/api";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface P {
  id: number;
  package_name: string;
  price: number;
  validity: number;
  max_order: string;
  max_product: string;
  pos: boolean;
  mobile_app: boolean;
  chat: boolean;
  review: boolean;
  self_delivery: boolean;
  default: boolean;
  status: boolean;
}

function inr(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function isUnlimited(v: string | null | undefined) {
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s === "" || s === "unlimited" || s === "-1";
}

export default async function SubscriptionPackagesPage() {
  const data = await adminFetch<{ packages: P[] }>("/admin/subscription-packages");
  const packages = data.packages;

  const activeCount = packages.filter((p) => p.status).length;
  const paid = packages.filter((p) => p.price > 0);
  const freeCount = packages.length - paid.length;
  const topPrice = paid.length > 0 ? Math.max(...paid.map((p) => p.price)) : 0;
  const avgValidity = packages.length > 0
    ? packages.reduce((s, p) => s + (p.validity || 0), 0) / packages.length
    : 0;

  const sorted = [...packages].sort((a, b) => a.price - b.price);

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
              Subscription · Restaurant billing
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Subscription packages</h1>
            <p className="mt-2 text-sm text-white/80 leading-relaxed">
              Plans you offer restaurants to access the platform. Each plan controls validity, order &amp; product
              caps, and which channels (POS, App, Chat, Review, Self-delivery) the restaurant can use.
            </p>
          </div>
          <CreateForm
            path="/subscription-packages"
            title="New subscription package"
            fields={[
              { name: "package_name", label: "Package name", required: true },
              { name: "price", label: "Price", type: "number", required: true },
              { name: "validity", label: "Validity (days)", type: "number", required: true },
              { name: "max_order", label: "Max orders", placeholder: "unlimited or number" },
              { name: "max_product", label: "Max products", placeholder: "unlimited or number" },
            ]}
          />
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total packages"
          value={packages.length.toString()}
          suffix={`${activeCount} active`}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Free vs paid"
          value={`${freeCount} / ${paid.length}`}
          suffix={paid.length > 0 ? `${paid.length} paid tier${paid.length === 1 ? "" : "s"}` : "no paid tier"}
          accent="teal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h11a4 4 0 014 4v0a4 4 0 01-4 4h-3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 14l-4 4 4 4" />
            </svg>
          }
        />
        <StatCard
          label="Top tier price"
          value={topPrice > 0 ? inr(topPrice) : "—"}
          suffix={paid.length > 0 ? `lowest ${inr(Math.min(...paid.map((p) => p.price)))}` : "only free plan"}
          accent="emerald"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Avg validity"
          value={avgValidity > 0 ? `${avgValidity.toFixed(0)}` : "—"}
          suffix={avgValidity > 0 ? `days per plan` : "no plans yet"}
          accent="teal"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* ── Packages table ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Subscription tiers</h2>
            <p className="text-xs text-slate-500 mt-0.5">Restaurants pick one plan at signup; the default tier auto-applies when no plan is chosen.</p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
            {packages.length} {packages.length === 1 ? "package" : "packages"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/60 text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Package</th>
                <th className="px-4 py-3 font-semibold text-right">Price</th>
                <th className="px-4 py-3 font-semibold text-right">Validity</th>
                <th className="px-4 py-3 font-semibold text-right">Max orders</th>
                <th className="px-4 py-3 font-semibold text-right">Max products</th>
                <th className="px-4 py-3 font-semibold">Features</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((p) => {
                const features: Array<{ k: string; on: boolean }> = [
                  { k: "POS", on: !!p.pos },
                  { k: "App", on: !!p.mobile_app },
                  { k: "Chat", on: !!p.chat },
                  { k: "Review", on: !!p.review },
                  { k: "Self-deliv", on: !!p.self_delivery },
                ];
                const featureCount = features.filter((f) => f.on).length;
                return (
                  <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">#{p.id}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 ring-1 ring-emerald-300/50 text-white flex items-center justify-center shadow-sm shrink-0 text-[11px] font-bold uppercase">
                          {p.package_name.slice(0, 2)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900">{p.package_name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {p.default && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Default
                              </span>
                            )}
                            {p.price === 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-bold text-slate-900 tabular-nums">{inr(p.price)}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">one-time</span>
                    </td>
                    <td className="px-4 py-4 text-right text-slate-800 tabular-nums">
                      {p.validity}<span className="text-[11px] text-slate-400 ml-0.5">days</span>
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      <CapCell value={p.max_order} />
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      <CapCell value={p.max_product} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {features.map((f) => (
                          <FeatureChip key={f.k} label={f.k} on={f.on} />
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{featureCount} / {features.length} enabled</div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill active={p.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <ToggleStatusButton basePath="/subscription-packages" id={p.id} currentStatus={p.status} />
                        <DeleteButton basePath="/subscription-packages" id={p.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {packages.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-slate-400">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-sm font-medium">No subscription packages yet</p>
                      <p className="text-xs">Use the &quot;+ New subscription package&quot; button above to create the first tier.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Closing card ───────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-lg shadow-emerald-900/20 ring-1 ring-white/10">
        <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="relative px-7 py-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <CalloutTile
            title="One plan per restaurant"
            body="A restaurant is on exactly one plan at a time. Renewals re-arm the validity window; expiry downgrades them to the default tier."
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <CalloutTile
            title="Feature gates"
            body="POS, App, Chat, Review and Self-delivery are toggled per plan. Disabling a feature on a plan hides those screens for every restaurant on that plan."
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <CalloutTile
            title="Disable, don't delete"
            body="Disabling a plan stops new sign-ups but keeps existing subscribers on it until renewal. Deleting only works on plans with no active subscribers."
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function CapCell({ value }: { value: string }) {
  if (isUnlimited(value)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0 4 4 0 010-5.656m5.656 5.656L9.172 9.172m5.656 5.656L18 18m-3.172-3.172a4 4 0 005.656-5.656 4 4 0 00-5.656 0L9.172 14.828" />
        </svg>
        Unlimited
      </span>
    );
  }
  return <span className="text-slate-800">{value}</span>;
}

function FeatureChip({ label, on }: { label: string; on: boolean }) {
  if (on) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-50 text-slate-400 border border-slate-200 line-through decoration-slate-300">
      {label}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Disabled
    </span>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent: "emerald" | "teal";
  icon: React.ReactNode;
}) {
  const palette: Record<string, { tile: string; ring: string; text: string; bg: string }> = {
    emerald: { tile: "bg-emerald-100", ring: "ring-emerald-200", text: "text-emerald-700", bg: "from-emerald-50/60 to-white" },
    teal: { tile: "bg-teal-100", ring: "ring-teal-200", text: "text-teal-700", bg: "from-teal-50/60 to-white" },
  };
  const p = palette[accent];
  return (
    <div className={`relative bg-gradient-to-b ${p.bg} rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-5 overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
        <span className={`w-10 h-10 rounded-xl ${p.tile} ring-1 ${p.ring} ${p.text} flex items-center justify-center shadow-sm`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{value}</div>
      {suffix && <div className="mt-0.5 text-xs text-slate-500">{suffix}</div>}
    </div>
  );
}

function CalloutTile({ title, body, icon }: { title: string; body: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white/5 ring-1 ring-white/10 backdrop-blur-sm rounded-xl px-4 py-4">
      <div className="flex items-center gap-2 text-white font-semibold">
        <span className="w-7 h-7 rounded-lg bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-white">
          {icon}
        </span>
        <span className="text-sm">{title}</span>
      </div>
      <p className="mt-2 text-xs text-white/75 leading-relaxed">{body}</p>
    </div>
  );
}
