import Link from "next/link";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";
import { type FieldSpec } from "../../../../../components/CreateForm";

interface PackageDetail {
  package: {
    id: number;
    package_name: string | null;
    price: number;
    validity: number;
    max_order: string | null;
    max_product: string | null;
    pos: boolean;
    mobile_app: boolean;
    chat: boolean;
    review: boolean;
    self_delivery: boolean;
    default: boolean;
    status: boolean;
  };
}

export default async function EditSubscriptionPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { package: p } = await adminFetch<PackageDetail>(`/admin/subscription-packages/${id}`);

  const fields: FieldSpec[] = [
    { name: "package_name", label: "Package name", type: "text", required: true },
    { name: "price", label: "Price ₹", type: "number", required: true },
    { name: "validity", label: "Validity (days)", type: "number", required: true },
    { name: "max_order", label: "Max orders", type: "text", placeholder: "unlimited or number" },
    { name: "max_product", label: "Max products", type: "text", placeholder: "unlimited or number" },
    { name: "pos", label: "POS access", type: "checkbox" },
    { name: "mobile_app", label: "Mobile app access", type: "checkbox" },
    { name: "chat", label: "Chat", type: "checkbox" },
    { name: "review", label: "Review", type: "checkbox" },
    { name: "self_delivery", label: "Self delivery", type: "checkbox" },
    { name: "default", label: "Default plan", type: "checkbox" },
    { name: "status", label: "Active", type: "checkbox" },
  ];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> SUBSCRIPTION · RESTAURANT BILLING
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit subscription package</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Update <span className="font-semibold">{p.package_name ?? `#${p.id}`}</span> — price, validity, order/product caps and which channels it unlocks.
          </p>
        </div>
      </div>

      <div>
        <Link href="/dashboard/subscription-packages" className="text-sm text-emerald-700 hover:underline">← All packages</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/subscription-packages/${p.id}`}
          submitLabel="Save package"
          redirectTo="/dashboard/subscription-packages"
          fields={fields}
          initialValues={{
            package_name: p.package_name,
            price: p.price,
            validity: p.validity,
            max_order: p.max_order ?? "unlimited",
            max_product: p.max_product ?? "unlimited",
            pos: !!p.pos,
            mobile_app: !!p.mobile_app,
            chat: !!p.chat,
            review: !!p.review,
            self_delivery: !!p.self_delivery,
            default: !!p.default,
            status: !!p.status,
          }}
        />
      </div>
    </div>
  );
}
