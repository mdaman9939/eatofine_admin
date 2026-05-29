import { adminFetch } from "../../../lib/api";
import { TablePage } from "../../../components/TablePage";
import { ActionButton } from "../../../components/ActionButton";

interface M {
  id: number;
  method_name: string;
  status: number;
}

export default async function OfflinePaymentMethodsPage() {
  const data = await adminFetch<{ offline_payment_methods: M[] }>("/admin/offline-payment-methods");
  return (
    <TablePage
      title="Offline payment methods"
      subtitle={`${data.offline_payment_methods.length} methods`}
      rows={data.offline_payment_methods}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Name", cell: (r) => r.method_name },
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
            <ActionButton
              path={`/offline-payment-methods/${r.id}/status`}
              method="PATCH"
              body={{ status: r.status ? 0 : 1 }}
              label={r.status ? "Disable" : "Enable"}
              variant={r.status ? "subtle" : "primary"}
            />
          ),
        },
      ]}
    />
  );
}
