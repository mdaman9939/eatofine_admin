import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";

interface M {
  id: number;
  method_name: string;
  method_fields?: string | null;
  method_informations?: string | null;
  status: number;
}

export default async function EditOfflineMethodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await adminFetch<{ offline_payment_methods: M[] }>("/admin/offline-payment-methods");
  const m = data.offline_payment_methods.find((x) => String(x.id) === id);
  if (!m) notFound();

  return (
    <div className="p-8 max-w-2xl space-y-5">
      <div>
        <Link href="/dashboard/offline-payment-methods" className="text-sm text-emerald-700 hover:underline">← All offline payment methods</Link>
        <h1 className="mt-2 text-2xl font-semibold">Edit method — {m.method_name}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/offline-payment-methods/${m.id}`}
          submitLabel="Save changes"
          redirectTo="/dashboard/offline-payment-methods"
          initialValues={{
            method_name: m.method_name,
            method_fields: m.method_fields ?? "",
            method_informations: m.method_informations ?? "",
            status: !!m.status,
          }}
          fields={[
            { name: "method_name", label: "Method name", type: "text", required: true },
            { name: "method_fields", label: "Payment details / fields", type: "textarea" },
            { name: "method_informations", label: "Instructions for customer", type: "textarea" },
            { name: "status", label: "Active", type: "checkbox" },
          ]}
        />
      </div>
    </div>
  );
}
