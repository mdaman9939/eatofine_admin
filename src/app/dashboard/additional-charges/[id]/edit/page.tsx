import Link from "next/link";
import { notFound } from "next/navigation";
import { adminFetch } from "../../../../../lib/api";
import { EditForm } from "../../../../../components/EditForm";
import { type FieldSpec } from "../../../../../components/CreateForm";

interface Charge {
  id: number;
  charge_head: string;
  charge_type: "fixed" | "percentage";
  amount: number;
  gst_applicable: boolean;
  gst_rate: number;
  hsn_sac: string | null;
  description: string | null;
  status: boolean;
  order_types: string[];
}

export default async function EditAdditionalChargePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const charges = await adminFetch<Charge[]>("/admin/additional-charges").catch(() => [] as Charge[]);
  const c = (Array.isArray(charges) ? charges : []).find((x) => Number(x.id) === Number(id));
  if (!c) notFound();

  const fields: FieldSpec[] = [
    { name: "charge_head", label: "Charge head", type: "text", required: true, placeholder: "Packaging Fee" },
    { name: "charge_type", label: "Type", type: "select", options: [{ value: "fixed", label: "Fixed ₹" }, { value: "percentage", label: "Percentage %" }] },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "gst_applicable", label: "GST applicable", type: "checkbox" },
    { name: "gst_rate", label: "GST %", type: "number" },
    { name: "hsn_sac", label: "HSN / SAC code", type: "text", placeholder: "998599" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "status", label: "Active", type: "checkbox" },
    { name: "ot_heading", label: "Applies to order types", type: "heading" },
    { name: "apply_take_away", label: "Take Away", type: "checkbox" },
    { name: "apply_dine_in", label: "Dine In", type: "checkbox" },
    { name: "apply_delivery", label: "Home Delivery", type: "checkbox" },
  ];

  const ot = Array.isArray(c.order_types) ? c.order_types : ["take_away", "dine_in", "delivery"];

  return (
    <div className="relative p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />

      <div className="relative overflow-hidden rounded-2xl sidebar-gradient text-white shadow-xl shadow-emerald-900/30 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
        <div className="relative px-8 py-7">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/70 font-semibold">
            <span className="inline-block w-1 h-1 rounded-full bg-white/70" /> ENHANCEMENTS · ADDITIONAL CHARGES
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Edit additional charge</h1>
          <p className="mt-2 text-sm text-white/80 leading-relaxed max-w-2xl">
            Update <span className="font-semibold">{c.charge_head}</span> — its type, amount, GST and HSN/SAC code.
          </p>
        </div>
      </div>

      <div>
        <Link href="/dashboard/additional-charges" className="text-sm text-emerald-700 hover:underline">← All charges</Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <EditForm
          path={`/additional-charges/${c.id}`}
          submitLabel="Save charge"
          redirectTo="/dashboard/additional-charges"
          fields={fields}
          initialValues={{
            charge_head: c.charge_head,
            charge_type: c.charge_type ?? "fixed",
            amount: c.amount,
            gst_applicable: !!c.gst_applicable,
            gst_rate: c.gst_rate ?? 0,
            hsn_sac: c.hsn_sac ?? "",
            description: c.description ?? "",
            status: !!c.status,
            apply_take_away: ot.includes("take_away"),
            apply_dine_in: ot.includes("dine_in"),
            apply_delivery: ot.includes("delivery"),
          }}
        />
      </div>
    </div>
  );
}
