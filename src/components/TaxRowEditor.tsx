"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Tax {
  id: number;
  charge_head: string;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  hsn_sac: string | null;
  configurable: boolean;
}

export function TaxRowEditor({ tax }: { tax: Tax }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [gstRate, setGstRate] = useState(tax.gst_rate);
  const [cgst, setCgst] = useState(tax.cgst);
  const [sgst, setSgst] = useState(tax.sgst);
  const [igst, setIgst] = useState(tax.igst);
  const [hsn, setHsn] = useState(tax.hsn_sac ?? "");

  async function save() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/tax-engine/master/${tax.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ gst_rate: gstRate, cgst, sgst, igst, hsn_sac: hsn }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 120));
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  async function del() {
    if (!window.confirm(`Delete charge head "${tax.charge_head}"?`)) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/tax-engine/master/${tax.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else setError((await res.text()).slice(0, 120));
    });
  }

  if (!open) {
    return (
      <span className="flex gap-2">
        <button onClick={() => setOpen(true)} className="rounded bg-zinc-100 hover:bg-zinc-200 text-xs px-2 py-1">
          Edit
        </button>
        {tax.configurable && (
          <button onClick={del} disabled={pending} className="rounded bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1">
            Delete
          </button>
        )}
      </span>
    );
  }

  return (
    <div className="absolute z-10 bg-white border border-slate-300 rounded-lg shadow-lg p-4 mt-1 right-0 w-80 text-left">
      <div className="text-xs font-semibold text-slate-700 mb-3">Edit GST: {tax.charge_head}</div>
      <div className="space-y-2 text-xs">
        <NumInput label="GST rate %" value={gstRate} onChange={setGstRate} />
        <div className="grid grid-cols-3 gap-2">
          <NumInput label="CGST %" value={cgst} onChange={setCgst} />
          <NumInput label="SGST %" value={sgst} onChange={setSgst} />
          <NumInput label="IGST %" value={igst} onChange={setIgst} />
        </div>
        <label className="block">
          <span className="text-slate-600">HSN / SAC</span>
          <input value={hsn} onChange={(e) => setHsn(e.target.value)} className="mt-1 block w-full rounded border border-slate-300 px-2 py-1 text-sm" />
        </label>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <div className="flex gap-2 justify-end mt-3">
        <button onClick={() => setOpen(false)} className="rounded px-3 py-1 text-xs text-slate-600">Cancel</button>
        <button onClick={save} disabled={pending} className="rounded bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-semibold px-3 py-1 shadow-sm hover:shadow transition-all disabled:opacity-50">
          {pending ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-slate-600">{label}</span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="mt-1 block w-full rounded border border-slate-300 px-2 py-1 text-sm"
      />
    </label>
  );
}
