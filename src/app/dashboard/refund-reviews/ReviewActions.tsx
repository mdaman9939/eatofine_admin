"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Confirm / Reject buttons for one pending partner-penalty review. Confirming
 * actually debits the at-fault partner's wallet (and credits any compensation);
 * rejecting waives the penalty. Both require admin remarks for the audit trail.
 */
export function ReviewActions({ decisionId }: { decisionId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"confirm" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!mode) return;
    if (!remarks.trim()) { setError("Remarks are required."); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/refund-engine/pending/${decisionId}/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ remarks }),
      });
      if (!res.ok) { setError((await res.text()).slice(0, 160)); return; }
      setMode(null); setRemarks("");
      router.refresh();
    });
  }

  return (
    <>
      <span className="inline-flex gap-2">
        <button
          type="button"
          onClick={() => { setMode("confirm"); setRemarks(""); setError(null); }}
          className="rounded-lg bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 text-white text-xs font-semibold px-3 py-1.5 shadow-sm"
        >
          Confirm penalty
        </button>
        <button
          type="button"
          onClick={() => { setMode("reject"); setRemarks(""); setError(null); }}
          className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold px-3 py-1.5"
        >
          Waive
        </button>
      </span>

      {mode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setMode(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              {mode === "confirm" ? "Confirm penalty" : "Waive penalty"} — review #{decisionId}
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              {mode === "confirm"
                ? "This will debit the at-fault partner's wallet (and credit any compensation) right now."
                : "No partner wallet will be charged. The order stays cancelled and the customer keeps their refund."}
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">Admin remarks <span className="text-rose-600">*</span></span>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Reason for this decision (audit trail)."
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:border-rose-500"
              />
            </label>
            {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setMode(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !remarks.trim()}
                className={`rounded-lg text-white text-sm font-semibold px-5 py-2 disabled:opacity-50 ${mode === "confirm" ? "bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500" : "bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500"}`}
              >
                {pending ? "Saving…" : mode === "confirm" ? "Confirm & debit" : "Waive penalty"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
