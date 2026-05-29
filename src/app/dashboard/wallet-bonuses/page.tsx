import { adminFetch } from "../../../lib/api";
import { TablePage, StatusBadge, fmtDate } from "../../../components/TablePage";
import { ToggleStatusButton, DeleteButton } from "../../../components/ActionButton";
import { CreateForm } from "../../../components/CreateForm";

interface WalletBonus {
  id: number;
  title: string;
  bonus_type: string;
  bonus_amount: number;
  minimum_add_amount: number;
  maximum_bonus_amount: number;
  start_date: string | null;
  end_date: string | null;
  status: boolean;
}

export default async function WalletBonusesPage() {
  const data = await adminFetch<{ wallet_bonuses: WalletBonus[] }>("/admin/wallet-bonuses");
  return (
    <>
      <div className="px-8 pt-8">
        <CreateForm
          path="/wallet-bonuses"
          title="New wallet bonus"
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "bonus_type", label: "Bonus type", type: "select", options: [{ value: "percentage", label: "%" }, { value: "amount", label: "Flat ₹" }], defaultValue: "percentage", required: true },
            { name: "bonus_amount", label: "Bonus amount", type: "number", required: true },
            { name: "minimum_add_amount", label: "Minimum add amount", type: "number" },
            { name: "maximum_bonus_amount", label: "Max bonus", type: "number" },
            { name: "start_date", label: "Starts", type: "date" },
            { name: "end_date", label: "Ends", type: "date" },
          ]}
        />
      </div>
      <TablePage
        title="Wallet bonuses"
        subtitle={`${data.wallet_bonuses.length} bonuses`}
        rows={data.wallet_bonuses}
        rowKey={(r) => r.id}
        columns={[
          { header: "Title", cell: (r) => r.title },
          { header: "Type", cell: (r) => r.bonus_type },
          { header: "Amount", cell: (r) => `${r.bonus_amount}${r.bonus_type === "percentage" ? "%" : "₹"}` },
          { header: "Min add", cell: (r) => `₹${r.minimum_add_amount}` },
          { header: "Max bonus", cell: (r) => `₹${r.maximum_bonus_amount}` },
          { header: "Window", cell: (r) => <span className="text-xs">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</span> },
          { header: "Status", cell: (r) => <StatusBadge value={r.status} /> },
          {
            header: "Actions",
            cell: (r) => (
              <span className="flex gap-2">
                <ToggleStatusButton basePath="/wallet-bonuses" id={r.id} currentStatus={r.status} />
                <DeleteButton basePath="/wallet-bonuses" id={r.id} />
              </span>
            ),
          },
        ]}
      />
    </>
  );
}
