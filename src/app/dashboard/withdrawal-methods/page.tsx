import { adminFetch } from "../../../lib/api";
import { TablePage } from "../../../components/TablePage";

interface M {
  id: number;
  method_name: string;
  method_fields: string;
  is_default: number;
  is_active: number;
}

export default async function WithdrawalMethodsPage() {
  const data = await adminFetch<{ withdrawal_methods: M[] }>("/admin/withdrawal-methods");
  return (
    <TablePage
      title="Withdrawal methods"
      subtitle={`${data.withdrawal_methods.length} methods`}
      description="See the payout methods (such as bank transfer) that delivery men and restaurants can choose when requesting their money."
      rows={data.withdrawal_methods}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Name", cell: (r) => r.method_name },
        { header: "Default", cell: (r) => (r.is_default ? "yes" : "no") },
        { header: "Active", cell: (r) => (r.is_active ? "yes" : "no") },
      ]}
    />
  );
}
