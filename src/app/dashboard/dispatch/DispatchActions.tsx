"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface DM {
  id: number;
  name: string;
}

export function AssignDmButton({ orderId, deliveryMen }: { orderId: number; deliveryMen: DM[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!selectedId) {
      setError("Pick a delivery man");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/dispatch/${orderId}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delivery_man_id: Number(selectedId) }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5"
      >
        Assign DM
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900"
      >
        <option value="">Select rider…</option>
        {deliveryMen.map((dm) => (
          <option key={dm.id} value={dm.id}>{dm.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-2.5 py-1"
      >
        {pending ? "…" : "Assign"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-slate-500 hover:text-slate-700 text-xs"
      >
        Cancel
      </button>
      {error && <span className="text-rose-600 text-xs">{error}</span>}
    </div>
  );
}
