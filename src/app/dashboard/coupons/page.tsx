import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate, fmtMoney } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface Coupon {
  id: number;
  title: string | null;
  code: string | null;
  start_date: string | null;
  expire_date: string | null;
  min_purchase: number;
  max_discount: number;
  discount: number;
  discount_type: string;
  coupon_type: string;
  limit: number | null;
  total_uses: number;
  status: boolean;
}

export default async function CouponsPage() {
  const data = await adminFetch<{ coupons: Coupon[] }>("/admin/coupons");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/coupons"
          title="New coupon"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "code", label: "Code", required: true, placeholder: "WELCOME10" },
            { name: "discount", label: "Discount", type: "number", required: true },
            { name: "discount_type", label: "Discount type", type: "select", options: [{ value: "percentage", label: "%" }, { value: "amount", label: "Flat ₹" }], defaultValue: "percentage" },
            { name: "min_purchase", label: "Minimum purchase", type: "number" },
            { name: "max_discount", label: "Max discount", type: "number" },
            { name: "start_date", label: "Starts", type: "date" },
            { name: "expire_date", label: "Expires", type: "date" },
            { name: "limit", label: "Per-customer limit", type: "number" },
          ]}
        />
      </div>
      <TablePage
        title="Coupons"
        subtitle={`${data.coupons.length} coupons`}
        rows={data.coupons}
        rowKey={(r) => r.id}
        columns={[
          { header: "Code", cell: (r) => <span className="font-mono">{r.code}</span> },
          { header: "Title", cell: (r) => r.title ?? "—" },
          { header: "Discount", cell: (r) => `${r.discount}${r.discount_type === "percentage" ? "%" : "₹"}` },
          { header: "Min purchase", cell: (r) => fmtMoney(r.min_purchase) },
          { header: "Max discount", cell: (r) => fmtMoney(r.max_discount) },
          { header: "Uses", cell: (r) => `${r.total_uses}${r.limit ? `/${r.limit}` : ""}` },
          { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date)} – {fmtDate(r.expire_date)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <ToggleStatusButton basePath="/coupons" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/coupons" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
