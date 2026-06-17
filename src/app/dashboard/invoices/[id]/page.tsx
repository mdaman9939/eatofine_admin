import Link from "next/link";
import { adminFetch } from "../../../../lib/api";
import { PrintButton } from "./PrintButton";

interface Invoice {
  invoice_no: string;
  eatofine_invoice_no: string;
  order_id: number;
  order_date: string | null;
  issued_on: string | null;
  restaurant: { name: string; address: string; gstin: string | null; fssai: string | null; cin: string | null };
  customer: { name: string; email: string | null; phone: string | null; address: string; place_of_delivery: string | null };
  restaurant_invoice: {
    hsn: string;
    service_type: string;
    items: Array<{ name: string; qty: number; unit_rate: number; amount: number }>;
    sub_total: number;
    discount: number;
    net_value: number;
    gst_rate_half: number;
    cgst: number;
    igst: number;
    total: number;
  };
  eatofine_invoice: {
    hsn: string;
    supply_description: string;
    rows: Array<{ description: string; amount: number; cgst: number; sgst: number; net: number }>;
    total: number;
  };
  payment_method: string | null;
  payment_status: string;
}

const EATOFINE_DEFAULTS = {
  legal_name: "Eatofine Delivery Service Pvt. Ltd.",
  short_name: "EATOFINE",
  registered_office: "FF2, Vishnu Palace, Sec 20B, Faridabad NIT, Faridabad, Haryana, India, 121001, India",
  state: "Haryana",
  state_code: "06",
  cin: "U56103HR2025PTC131940",
  gstin: "",
  pan: "",
  fssai: "",
  email: "eatofine@gmail.com",
  website: "www.eatofine.com",
};

async function loadEatofineSettings() {
  try {
    const data = await adminFetch<{ settings: Array<{ key: string; value: string | null }> }>(
      "/admin/business-settings?prefix=invoice.",
    );
    const map = new Map(data.settings.map((s) => [s.key, s.value]));
    const pick = (key: string, fallback: string) => {
      const v = map.get(`invoice.${key}`);
      return v && v.trim() !== "" ? v : fallback;
    };
    return {
      legal_name: pick("company_name", EATOFINE_DEFAULTS.legal_name),
      short_name: pick("short_name", EATOFINE_DEFAULTS.short_name),
      registered_office: pick("registered_office", EATOFINE_DEFAULTS.registered_office),
      state: pick("state", EATOFINE_DEFAULTS.state),
      state_code: pick("state_code", EATOFINE_DEFAULTS.state_code),
      cin: pick("cin", EATOFINE_DEFAULTS.cin),
      gstin: pick("gstin", EATOFINE_DEFAULTS.gstin),
      pan: pick("pan", EATOFINE_DEFAULTS.pan),
      fssai: pick("fssai", EATOFINE_DEFAULTS.fssai),
      email: pick("email", EATOFINE_DEFAULTS.email),
      website: pick("website", EATOFINE_DEFAULTS.website),
    };
  } catch {
    return EATOFINE_DEFAULTS;
  }
}

/** Indian-English amount in words ("One Thousand Twenty-Nine Rupees Only"). */
function numberToWords(num: number): string {
  if (!Number.isFinite(num)) return "Zero Rupees Only";
  const rupees = Math.floor(num);
  const paisa = Math.round((num - rupees) * 100);
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const below1000 = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below1000(n % 100) : "");
  };
  const inWords = (n: number): string => {
    if (n === 0) return "Zero";
    let r = "";
    const crore = Math.floor(n / 10_000_000); n %= 10_000_000;
    const lakh = Math.floor(n / 100_000); n %= 100_000;
    const thousand = Math.floor(n / 1000); n %= 1000;
    if (crore) r += below1000(crore) + " Crore ";
    if (lakh) r += below1000(lakh) + " Lakh ";
    if (thousand) r += below1000(thousand) + " Thousand ";
    if (n) r += below1000(n);
    return r.trim();
  };
  const rupeesWords = inWords(rupees);
  if (paisa === 0) return `${rupeesWords} Rupees Only`;
  return `${rupeesWords} Rupees and ${inWords(paisa)} Paisa Only`;
}

const fmtDate = (v: string | null, sep = "-") => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}${sep}${mm}${sep}${d.getFullYear()}`;
};

const orPlaceholder = (v: string | null | undefined) =>
  v && v.trim() !== "" ? v : "Unregistered";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [inv, EATOFINE] = await Promise.all([
    adminFetch<Invoice>(`/admin/invoices/${id}`),
    loadEatofineSettings(),
  ]);

  const ri = inv.restaurant_invoice;
  const ei = inv.eatofine_invoice;
  const invoiceDate = fmtDate(inv.issued_on ?? inv.order_date);
  const placeOfDelivery = inv.customer.place_of_delivery ?? `${EATOFINE.state} (${EATOFINE.state_code})`;

  return (
    <div className="p-6 max-w-4xl mx-auto print:p-0 print:max-w-none">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:underline">← All invoices</Link>
        <PrintButton />
      </div>

      <div id="invoice-print-area">
        {/* ═══════════════ PAGE 1 — On Behalf of Restaurant ═══════════════ */}
        <section className="invoice-page bg-white shadow-sm border border-slate-200 print:shadow-none print:border-0 p-8 mb-8">
          <Brand short={EATOFINE.short_name} tag="Original for Recipient" />

          <Band>Tax Invoice (On Behalf of Restaurant)</Band>

          {/* Restaurant + invoice meta */}
          <div className="grid grid-cols-2 gap-x-8 text-[13px] mt-3">
            <div className="space-y-0.5">
              <KV k="Business Name" v={EATOFINE.legal_name} />
              <KV k="Restaurant Name" v={inv.restaurant.name} />
              <KV k="Restaurant FSSAI" v={orPlaceholder(inv.restaurant.fssai)} />
              <KV k="Restaurant Address" v={inv.restaurant.address} />
              <KV k="Restaurant GSTIN" v={orPlaceholder(inv.restaurant.gstin)} />
              <KV k="Restaurant CIN" v={orPlaceholder(inv.restaurant.cin)} />
            </div>
            <div className="space-y-0.5">
              <KV k="Invoice No" v={inv.invoice_no} mono />
              <KV k="Invoice Date" v={invoiceDate} />
            </div>
          </div>

          <Band yellow className="mt-4">Customer Details</Band>
          <div className="grid grid-cols-2 gap-x-8 text-[13px] mt-2">
            <KV k="Customer Name" v={inv.customer.name} />
            <KV k="Place of Delivery" v={placeOfDelivery} />
            <KV k="Address" v={inv.customer.address} />
          </div>

          <Band peach className="mt-4">Service Details</Band>
          <div className="grid grid-cols-2 gap-x-8 text-[13px] mt-2">
            <KV k="HSN Code" v={ri.hsn} />
            <KV k="Service Type" v={ri.service_type} />
          </div>

          <Band className="mt-4">Order Details</Band>
          <table className="w-full text-[12px] border border-t-0 border-slate-400 border-collapse">
            <thead>
              <tr className="text-slate-800">
                <Th>Item</Th><Th c>Qty</Th><Th r>Unit Rate</Th><Th r>Amount</Th>
                <Th r>Sub Total</Th><Th r>Discount</Th><Th r>Net Value</Th>
                <Th r>CGST<br /><span className="font-normal text-[9px]">({ri.gst_rate_half}%)</span></Th>
                <Th r>IGST<br /><span className="font-normal text-[9px]">({ri.gst_rate_half}%)</span></Th>
                <Th r>Total</Th>
              </tr>
            </thead>
            <tbody>
              {ri.items.map((it, i) => (
                <tr key={i} className="text-slate-800">
                  <Td>{it.name}</Td><Td c>{it.qty}</Td><Td r>{it.unit_rate.toFixed(2)}</Td><Td r>{it.amount.toFixed(2)}</Td>
                  <Td /><Td /><Td /><Td /><Td /><Td />
                </tr>
              ))}
              {/* Totals row — matches the PDF (single summary row at the bottom). */}
              <tr className="font-semibold text-slate-900">
                <Td /><Td /><Td /><Td />
                <Td r>₹{ri.sub_total.toFixed(2)}</Td>
                <Td r>₹{ri.discount.toFixed(2)}</Td>
                <Td r>₹{ri.net_value.toFixed(2)}</Td>
                <Td r>₹{ri.cgst.toFixed(2)}</Td>
                <Td r>₹{ri.igst.toFixed(2)}</Td>
                <Td r>₹{ri.total.toFixed(2)}</Td>
              </tr>
            </tbody>
          </table>

          <p className="text-[12px] mt-3">
            <span className="font-semibold">Amount Total in words:</span>{" "}
            {numberToWords(ri.total)} (against Order id: {inv.order_id})
          </p>

          <div className="text-[12px] mt-5">
            <div className="font-bold">For {EATOFINE.legal_name}</div>
            <div>Eatofine PAN : {orPlaceholder(EATOFINE.pan)}</div>
            <div>Eatofine CIN : {EATOFINE.cin}</div>
            <div>Eatofine GSTIN : {orPlaceholder(EATOFINE.gstin)}</div>
            <div>Eatofine FSSAI : {orPlaceholder(EATOFINE.fssai)}</div>
          </div>
          <div className="text-[12px] mt-3">
            <span className="font-semibold">HSN Code:</span> {ri.hsn}{" "}
            <span className="font-semibold ml-4">Service Type:</span> {ri.service_type}
          </div>

          <Disclaimer />
        </section>

        {/* ═══════════════ PAGE 2 — Eatofine service invoice ═══════════════ */}
        <section className="invoice-page bg-white shadow-sm border border-slate-200 print:shadow-none print:border-0 p-8">
          <Brand short={EATOFINE.short_name} />
          <Band>Tax Invoice <span className="font-normal italic">(Original for Recipient)</span></Band>

          {/* Company + invoice meta box */}
          <div className="border border-slate-400 mt-3 text-[12px]">
            <div className="grid grid-cols-2 divide-x divide-slate-400">
              <div className="p-3">
                <div className="font-bold">{EATOFINE.legal_name}</div>
                <div className="mt-1"><span className="font-semibold">Registered Office:</span> {EATOFINE.registered_office}</div>
                <div>CIN: {EATOFINE.cin}</div>
                <div>GSTIN: {orPlaceholder(EATOFINE.gstin)}</div>
                <div>PAN: {orPlaceholder(EATOFINE.pan)}</div>
                <div>FSSAI: {orPlaceholder(EATOFINE.fssai)}</div>
              </div>
              <div className="p-3">
                <div><span className="font-semibold">Invoice Number:</span> <span className="font-mono">{inv.eatofine_invoice_no}</span></div>
                <div><span className="font-semibold">Invoice Date:</span> {invoiceDate}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-400 border-t border-slate-400">
              <div className="p-3">
                <div>Customer Name: {inv.customer.name}</div>
                <div>Email: {inv.customer.email ?? "—"}</div>
                <div>Phone: {inv.customer.phone ?? "—"}</div>
                <div>Place of Delivery: {placeOfDelivery}</div>
              </div>
              <div className="p-3">
                <div className="font-semibold">Service Details</div>
                <div>HSN Code: {ei.hsn}</div>
                <div>Supply Description: {ei.supply_description}</div>
              </div>
            </div>
          </div>

          <Band className="mt-4">Product Summary:</Band>
          <div className="flex justify-between text-[13px] font-semibold mt-2 mb-1">
            <span>Order ID: {inv.order_id}</span>
            <span>Order Date: {fmtDate(inv.order_date, "/")}</span>
          </div>

          <table className="w-full text-[12px] border border-slate-400 border-collapse">
            <thead>
              <tr>
                <Th c>S.No</Th><Th>Description</Th><Th r>Amount (₹)</Th><Th r>CGST</Th><Th r>SGST</Th><Th r>Net Value</Th>
              </tr>
            </thead>
            <tbody>
              {ei.rows.map((row, i) => (
                <tr key={i} className="text-slate-800">
                  <Td c>{i + 1}.</Td>
                  <Td>{row.description}</Td>
                  <Td r>{row.amount.toFixed(2)}</Td>
                  <Td r>{row.cgst.toFixed(2)}</Td>
                  <Td r>{row.sgst.toFixed(2)}</Td>
                  <Td r>{row.net.toFixed(2)}</Td>
                </tr>
              ))}
              <tr className="font-bold text-slate-900">
                <Td /><Td r>Total</Td><Td /><Td /><Td /><Td r>{ei.total.toFixed(2)}</Td>
              </tr>
            </tbody>
          </table>

          <p className="text-[12px] mt-3">
            <span className="font-semibold">Amount Total in words:</span>{" "}
            {numberToWords(ei.total)} (against Order id: {inv.order_id})
          </p>

          <div className="text-[12px] mt-6 text-right">
            <div className="font-semibold">{EATOFINE.legal_name}</div>
            <a href={`mailto:${EATOFINE.email}`} className="text-blue-600 hover:underline block">{EATOFINE.email}</a>
            <a href={`https://${EATOFINE.website}`} className="text-blue-600 hover:underline block">{EATOFINE.website}</a>
          </div>

          <Disclaimer />
        </section>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden !important; }
          #invoice-print-area, #invoice-print-area * { visibility: visible !important; }
          #invoice-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          .invoice-page { break-after: page; page-break-after: always; border: 0 !important; box-shadow: none !important; margin: 0 !important; }
          .invoice-page:last-child { break-after: auto; page-break-after: auto; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          aside, nav, header, .print\\:hidden { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Small presentational helpers ────────────────────────────────────────

function Brand({ short, tag }: { short: string; tag?: string }) {
  return (
    <div className="flex items-start justify-between">
      <div className="text-2xl font-black tracking-wide text-orange-600">{short}</div>
      {tag && <div className="text-sm font-bold text-slate-900">{tag}</div>}
    </div>
  );
}

function Band({ children, yellow, peach, className = "" }: { children: React.ReactNode; yellow?: boolean; peach?: boolean; className?: string }) {
  const bg = yellow ? "bg-amber-400" : peach ? "bg-orange-200 text-slate-900" : "bg-orange-500";
  const text = peach ? "text-slate-900" : "text-white";
  return <div className={`${bg} ${text} px-3 py-1.5 text-sm font-bold ${className}`}>{children}</div>;
}

function KV({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <span className="font-semibold">{k}:</span> <span className={mono ? "font-mono font-semibold" : ""}>{v}</span>
    </div>
  );
}

function Th({ children, c, r }: { children?: React.ReactNode; c?: boolean; r?: boolean }) {
  return <th className={`border border-slate-400 px-2 py-1.5 font-semibold ${c ? "text-center" : r ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, c, r }: { children?: React.ReactNode; c?: boolean; r?: boolean }) {
  return <td className={`border border-slate-400 px-2 py-1.5 align-top ${c ? "text-center" : r ? "text-right" : "text-left"}`}>{children}</td>;
}

function Disclaimer() {
  return (
    <ol className="text-[12px] mt-6 space-y-0.5 list-decimal list-inside font-semibold">
      <li>This is a computer generated document, No signature required.</li>
      <li>There is no reverse charge applicable on this order/service.</li>
    </ol>
  );
}
