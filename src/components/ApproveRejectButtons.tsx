"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Two-button row for approve/reject queues. Posts to
 *  /api/admin/<basePath>/<id>/{approve|reject}. Reject opens a small modal
 *  for the required reason. Refreshes the table on success. */
export function ApproveRejectButtons({ basePath, id }: { basePath: string; id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function callAction(action: "approve" | "reject", reasonText?: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/${basePath}/${id}/${action}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: action === "reject" ? JSON.stringify({ reason: reasonText ?? "" }) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 160));
        return;
      }
      setShowRejectModal(false);
      setReason("");
      router.refresh();
    });
  }

  return (
    <>
      <span className="inline-flex gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => callAction("approve")}
          className="cursor-pointer inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setShowRejectModal(true)}
          className="cursor-pointer inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Reject
        </button>
      </span>

      {showRejectModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !pending && setShowRejectModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-5 py-3 flex items-center justify-between">
              <h3 className="font-semibold tracking-wide text-sm">Reject application</h3>
              <button
                type="button"
                onClick={() => !pending && setShowRejectModal(false)}
                className="text-white/70 hover:text-white cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Reason</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Missing FSSAI license, bank account not verified…"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 transition-all min-h-[90px]"
                />
              </label>
              <p className="text-[11px] text-slate-500">The applicant will be notified via email with this reason.</p>
              {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !pending && setShowRejectModal(false)}
                className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => callAction("reject", reason)}
                className="cursor-pointer rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5"
              >
                {pending ? "Rejecting…" : "Confirm reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
