import { adminFetch } from "../../../lib/api";
import { TablePage } from "../../../components/TablePage";

interface C {
  id: number;
  country: string | null;
  currency_code: string | null;
  currency_symbol: string | null;
  exchange_rate: number | null;
}

export default async function CurrenciesPage() {
  const data = await adminFetch<{ currencies: C[] }>("/admin/currencies");
  return (
    <TablePage
      title="Currencies"
      subtitle={`${data.currencies.length} currencies`}
      rows={data.currencies}
      rowKey={(r) => r.id}
      columns={[
        { header: "#", cell: (r) => r.id, className: "font-mono" },
        { header: "Country", cell: (r) => r.country ?? "—" },
        { header: "Code", cell: (r) => <span className="font-mono">{r.currency_code ?? "—"}</span> },
        { header: "Symbol", cell: (r) => r.currency_symbol ?? "—" },
        { header: "Exchange rate", cell: (r) => r.exchange_rate ?? "—" },
      ]}
    />
  );
}
