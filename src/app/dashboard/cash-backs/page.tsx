import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate, fmtMoney } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface CashBack {
  id: number;
  title: string | null;
  cashback_type: string | null;
  cashback_amount: number | null;
  min_purchase: number | null;
  max_discount: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status: boolean | null;
}

export default async function CashBacksPage() {
  const [data, usersRes] = await Promise.all([
    adminFetch<{ cash_backs: CashBack[] }>("/admin/cash-backs"),
    adminFetch<{ users?: Array<{ id: number; f_name: string | null; l_name: string | null; phone: string | null }> }>("/admin/users?limit=200").catch(() => ({} as { users?: Array<{ id: number; f_name: string | null; l_name: string | null; phone: string | null }> })),
  ]);
  const customerOptions = (usersRes.users ?? []).map((u) => ({
    value: String(u.id),
    label: `${u.f_name ?? ""} ${u.l_name ?? ""}`.trim() || u.phone || `#${u.id}`,
  }));

  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/cash-backs"
          title="Create Cashback Offer"
          submitLabel="Submit"
          fields={[
            { name: "title", label: "Title (default)", type: "text", required: true, placeholder: "e.g. Eid Dhamaka" },
            { name: "customer_id", label: "Select customer (blank = all)", type: "select", options: customerOptions },
            { name: "cashback_type", label: "Cashback type", type: "select", defaultValue: "percentage", options: [
              { value: "percentage", label: "Percentage (%)" },
              { value: "amount", label: "Amount (₹)" },
            ] },
            { name: "cashback_amount", label: "Cashback amount", type: "number", required: true, placeholder: "Ex: 100" },
            { name: "min_purchase", label: "Minimum purchase ₹", type: "number", placeholder: "Ex: 100" },
            { name: "max_discount", label: "Maximum discount ₹", type: "number", placeholder: "Ex: 100" },
            { name: "start_date", label: "Start date", type: "date" },
            { name: "end_date", label: "End date", type: "date" },
            { name: "limit", label: "Limit for same user", type: "number", placeholder: "Ex: 5" },
          ]}
        />
      </div>
      <TablePage
        title="Cashback offers"
        subtitle={`${data.cash_backs.length} offers`}
        rows={data.cash_backs}
        rowKey={(r) => r.id}
        empty="No cashback offers yet — create one above."
        columns={[
          { header: "#", cell: (r) => r.id, className: "font-mono" },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Type", cell: (r) => r.cashback_type ?? "—" },
          { header: "Amount", cell: (r) => (r.cashback_amount != null ? `${r.cashback_amount}${r.cashback_type === "percentage" ? "%" : "₹"}` : "—") },
          { header: "Min purchase", cell: (r) => fmtMoney(r.min_purchase ?? 0) },
          { header: "Max discount", cell: (r) => fmtMoney(r.max_discount ?? 0) },
          { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date ?? null)} – {fmtDate(r.end_date ?? null)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={!!r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <ToggleStatusButton basePath="/cash-backs" id={r.id} currentStatus={!!r.status} />
                <DeleteButton basePath="/cash-backs" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
