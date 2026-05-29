"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Mode = "approve" | "reject";

export function DocumentReviewActions({ id, status }: { id: number; status: "pending" | "approved" | "rejected" }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [remarks, setRemarks] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open(m: Mode) {
    setMode(m);
    setRemarks("");
    setError(null);
  }

  function close() {
    setMode(null);
    setRemarks("");
    setError(null);
  }

  function submit() {
    if (mode === "reject" && !remarks.trim()) {
      setError("Remarks are required when rejecting.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/submitted-documents/${id}/${mode}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ remarks: remarks.trim() || undefined }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 200));
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        {status !== "approved" && (
          <button
            type="button"
            onClick={() => open("approve")}
            className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-200"
          >
            Approve
          </button>
        )}
        {status !== "rejected" && (
          <button
            type="button"
            onClick={() => open("reject")}
            className="cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20 transition-all duration-200"
          >
            Reject
          </button>
        )}
      </div>

      {mode !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-md overflow-hidden">
            <div className={`px-5 py-3 text-white flex items-center justify-between bg-gradient-to-r ${mode === "approve" ? "from-emerald-600 to-emerald-700" : "from-rose-600 to-rose-700"}`}>
              <h3 className="text-sm font-semibold tracking-wide">
                {mode === "approve" ? "Approve document" : "Reject document"}
              </h3>
              <button type="button" onClick={close} className="cursor-pointer text-white/80 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-600">
                {mode === "approve"
                  ? "Approve this document for the user's profile. Remarks are optional and shared with them."
                  : "Reject this document. Remarks are required and shown to the user so they know what to fix."}
              </p>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Remarks {mode === "reject" && <span className="text-rose-500">*</span>}
                </span>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    mode === "approve"
                      ? "Optional — e.g. 'Verified against FSSAI portal.'"
                      : "Required — e.g. 'Document is blurred, please re-upload a clearer copy.'"
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all min-h-[110px]"
                  autoFocus
                />
              </label>
              {error && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>
              )}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
              <button type="button" onClick={close} className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending}
                className={`cursor-pointer rounded-md text-white text-sm font-semibold px-4 py-1.5 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                  mode === "approve"
                    ? "bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600"
                    : "bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600"
                }`}
              >
                {pending ? "…" : mode === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
