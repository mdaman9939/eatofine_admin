"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Per-order Refund / Cancellation panel. Drives the 14-scenario engine on the
 * backend — admin picks a scenario, sees a money/wallet preview, then confirms
 * with mandatory remarks. The backend then writes the refund row, credit note,
 * wallet ledger entries, and audit decision atomically.
 */

interface ScenarioOpt { key: string; cancelled_by: string; label: string }

interface Effects {
  refund_amount: number;
  refund_to_user: boolean;
  generate_invoice: boolean;
  generate_credit_note: boolean;
  penalty: { target: string | null; amount: number; components: string[] };
  restaurant_wallet: { direction: string; amount: number; note: string };
  deliveryman_wallet: { direction: string; amount: number; note: string };
  final_order_status: string;
  summary: string;
}

interface Preview {
  order_id: number;
  scenario: { key: string; label: string; cancelled_by: string };
  stage: { status: string; has_delivery_man: boolean; is_delivered: boolean };
  money: {
    item_total: number; tax: number; delivery_charge: number;
    packaging_amount: number; additional_charge: number;
    admin_commission: number; grand_total: number;
  };
  effects: Effects;
}

export function RefundPanel({ orderId, orderStatus }: { orderId: number; orderStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scenarios, setScenarios] = useState<ScenarioOpt[]>([]);
  const [picked, setPicked] = useState<string>("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Refund engine only matters for live orders. Once the order is in a
  // terminal state, hide the action — but still surface the history below.
  const isTerminal = orderStatus === "canceled" || orderStatus === "refunded" || orderStatus === "failed";

  useEffect(() => {
    if (!open) return;
    fetch(`/api/admin/refund-engine/${orderId}/applicable`)
      .then((r) => r.json())
      .then((d: { scenarios?: ScenarioOpt[] }) => setScenarios(d.scenarios ?? []))
      .catch(() => setError("Could not load scenarios."));
  }, [open, orderId]);

  useEffect(() => {
    if (!picked) { setPreview(null); return; }
    setError(null);
    fetch(`/api/admin/refund-engine/${orderId}/preview?scenario=${picked}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.text()).slice(0, 200));
        return r.json();
      })
      .then(setPreview)
      .catch((e: Error) => { setPreview(null); setError(e.message); });
  }, [picked, orderId]);

  function submit() {
    if (!preview) return;
    if (!remarks.trim()) { setError("Remarks are required."); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/refund-engine/${orderId}/apply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scenario: picked, remarks }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 200));
        return;
      }
      setOpen(false); setPicked(""); setPreview(null); setRemarks("");
      router.refresh();
    });
  }

  if (isTerminal) return null;

  return (
    <div className="mt-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 flex items-center justify-between text-left cursor-pointer"
      >
        <div>
          <div className="text-sm font-semibold text-rose-800">Refund / Cancellation engine</div>
          <div className="text-[11px] text-rose-700/80">Apply one of the 14 policy scenarios — restaurant or DM penalty, wallet adjustment, refund record, all atomic.</div>
        </div>
        <span className="text-rose-700 text-lg">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-rose-200/60">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">Pick a scenario</label>
            <select
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
            >
              <option value="">— Select a scenario —</option>
              {scenarios.map((s) => (
                <option key={s.key} value={s.key}>
                  [{s.cancelled_by}] {s.label}
                </option>
              ))}
            </select>
            {scenarios.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-700">No scenarios apply to this order's current stage.</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-rose-100 border border-rose-200 text-rose-800 px-3 py-2 text-xs">{error}</div>
          )}

          {preview && (
            <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
              <div className="text-sm text-slate-800 font-medium">{preview.effects.summary}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <Box title="Refund to user" tone={preview.effects.refund_to_user ? "emerald" : "slate"}>
                  {preview.effects.refund_to_user ? `₹${preview.effects.refund_amount.toFixed(2)}` : "No refund"}
                  <div className="mt-1 text-slate-500">
                    Invoice: <strong>{preview.effects.generate_invoice ? "Yes" : "Not generated"}</strong>
                    {" · "}Credit note: <strong>{preview.effects.generate_credit_note ? "Yes" : "N/A"}</strong>
                  </div>
                </Box>
                <Box title="Penalty" tone={preview.effects.penalty.target ? "rose" : "slate"}>
                  {preview.effects.penalty.target ? (
                    <>
                      <strong>{preview.effects.penalty.target}</strong> debited <strong>₹{preview.effects.penalty.amount.toFixed(2)}</strong>
                      <div className="mt-1 text-slate-500">Components: {preview.effects.penalty.components.join(" + ")}</div>
                    </>
                  ) : "None"}
                </Box>
                <Box title="Restaurant wallet" tone={walletTone(preview.effects.restaurant_wallet.direction)}>
                  <strong className="capitalize">{preview.effects.restaurant_wallet.direction}</strong>
                  {preview.effects.restaurant_wallet.direction !== "none" && (
                    <> · ₹{preview.effects.restaurant_wallet.amount.toFixed(2)}</>
                  )}
                  <div className="mt-1 text-slate-500">{preview.effects.restaurant_wallet.note}</div>
                </Box>
                <Box title="Deliveryman wallet" tone={walletTone(preview.effects.deliveryman_wallet.direction)}>
                  <strong className="capitalize">{preview.effects.deliveryman_wallet.direction}</strong>
                  {preview.effects.deliveryman_wallet.direction !== "none" && (
                    <> · ₹{preview.effects.deliveryman_wallet.amount.toFixed(2)}</>
                  )}
                  <div className="mt-1 text-slate-500">{preview.effects.deliveryman_wallet.note}</div>
                </Box>
              </div>
              <div className="text-[11px] text-slate-500">
                Final order status: <strong>{preview.effects.final_order_status}</strong>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Admin remarks <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Why this scenario? Required for audit trail."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setPicked(""); setPreview(null); setRemarks(""); }}
              className="cursor-pointer rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium px-4 py-2"
            >
              Close
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !preview || !remarks.trim()}
              className="cursor-pointer rounded-lg bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 shadow-sm"
            >
              {pending ? "Applying…" : "Apply decision"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function walletTone(dir: string): "emerald" | "rose" | "slate" {
  if (dir === "credit") return "emerald";
  if (dir === "debit") return "rose";
  return "slate";
}

function Box({ title, tone, children }: { title: string; tone: "emerald" | "rose" | "slate"; children: React.ReactNode }) {
  const cls = {
    emerald: "border-emerald-200 bg-emerald-50/60",
    rose: "border-rose-200 bg-rose-50/60",
    slate: "border-slate-200 bg-slate-50/60",
  }[tone];
  return (
    <div className={`rounded-lg border ${cls} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">{title}</div>
      <div className="text-slate-800">{children}</div>
    </div>
  );
}
