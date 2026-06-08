import Link from "next/link";
import { adminFetch } from "../../../lib/api";
import { TablePage } from "../../../components/TablePage";
import { ActionButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface M {
  id: number;
  method_name: string;
  method_fields?: unknown;
  status: number;
}

/** method_fields can be a plain string OR a JSON object (depending on how it
 *  was created) — render it safely so it never crashes React (#31). */
function fieldsText(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export default async function OfflinePaymentMethodsPage() {
  const data = await adminFetch<{ offline_payment_methods: M[] }>("/admin/offline-payment-methods");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/offline-payment-methods"
          title="New offline payment method"
          fields={[
            { name: "method_name", label: "Method name", type: "text", required: true, placeholder: "e.g. Bank Transfer" },
            { name: "method_fields", label: "Payment details / fields", type: "textarea", placeholder: "Account no, IFSC, bank name… (what the customer should enter)" },
            { name: "method_informations", label: "Instructions for customer", type: "textarea", placeholder: "How to pay using this method" },
          ]}
        />
      </div>
      <TablePage
        title="Offline payment methods"
        subtitle={`${data.offline_payment_methods.length} methods`}
        rows={data.offline_payment_methods}
        rowKey={(r) => r.id}
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Name", cell: (r) => r.method_name },
          { header: "Details", cell: (r) => <span className="text-xs text-slate-500 line-clamp-1 max-w-xs inline-block">{fieldsText(r.method_fields)}</span> },
          {
            header: "Status",
            cell: (r) => (
              <span className={`text-xs ${r.status ? "text-emerald-600" : "text-zinc-500"}`}>
                {r.status ? "active" : "inactive"}
              </span>
            ),
          },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <Link href={`/dashboard/offline-payment-methods/${r.id}/edit`} className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200">Edit</Link>
                <ActionButton
                  path={`/offline-payment-methods/${r.id}/status`}
                  method="PATCH"
                  body={{ status: r.status ? 0 : 1 }}
                  label={r.status ? "Disable" : "Enable"}
                  variant={r.status ? "subtle" : "primary"}
                />
                <DeleteButton basePath="/offline-payment-methods" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
