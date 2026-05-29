"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Mode = "investigating" | "resolved" | "dismissed";

const MODE_META: Record<Mode, { label: string; gradient: string; description: string }> = {
  investigating: {
    label: "Investigate",
    gradient: "from-amber-600 to-amber-700",
    description: "Mark this flag as actively under investigation. Notes are required so the next reviewer has context.",
  },
  resolved: {
    label: "Resolve",
    gradient: "from-emerald-600 to-emerald-700",
    description: "Close this flag as resolved — the underlying issue has been addressed. Notes are required to record what was done.",
  },
  dismissed: {
    label: "Dismiss",
    gradient: "from-slate-600 to-slate-700",
    description: "Dismiss this flag as a false alarm or duplicate. Notes are required to explain why.",
  },
};

const BUTTON_STYLE: Record<Mode, string> = {
  investigating:
    "bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-sm hover:shadow-md hover:shadow-amber-500/20",
  resolved:
    "bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20",
  dismissed:
    "bg-gradient-to-b from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white shadow-sm hover:shadow-md hover:shadow-slate-500/20",
};

export function FraudFlagResolver({
  id,
  status,
}: {
  id: number;
  status: "open" | "investigating" | "resolved" | "dismissed";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open(m: Mode) {
    setMode(m);
    setNotes("");
    setError(null);
  }

  function close() {
    setMode(null);
    setNotes("");
    setError(null);
  }

  function submit() {
    if (!notes.trim()) {
      setError("Notes are required.");
      return;
    }
    setError(null);
    const targetMode = mode;
    if (!targetMode) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/fraud-flags/${id}/resolve`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: targetMode, notes: notes.trim() }),
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

  // Terminal states — no further actions available
  const isTerminal = status === "resolved" || status === "dismissed";

  return (
    <>
      <div className="inline-flex items-center gap-1.5">
        {isTerminal ? (
          <span className="text-[11px] text-slate-400 italic">No actions</span>
        ) : (
          <>
            {status === "open" && (
              <button
                type="button"
                onClick={() => open("investigating")}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${BUTTON_STYLE.investigating}`}
              >
                Investigate
              </button>
            )}
            <button
              type="button"
              onClick={() => open("resolved")}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${BUTTON_STYLE.resolved}`}
            >
              Resolve
            </button>
            <button
              type="button"
              onClick={() => open("dismissed")}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${BUTTON_STYLE.dismissed}`}
            >
              Dismiss
            </button>
          </>
        )}
      </div>

      {mode !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 w-full max-w-md overflow-hidden">
            <div className={`px-5 py-3 text-white flex items-center justify-between bg-gradient-to-r ${MODE_META[mode].gradient}`}>
              <h3 className="text-sm font-semibold tracking-wide">
                {MODE_META[mode].label} fraud flag
              </h3>
              <button type="button" onClick={close} className="cursor-pointer text-white/80 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-600">{MODE_META[mode].description}</p>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Notes <span className="text-rose-500">*</span>
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Required — record the rationale, evidence reviewed, or action taken."
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
                className={`cursor-pointer rounded-md text-white text-sm font-semibold px-4 py-1.5 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-gradient-to-b ${MODE_META[mode].gradient} hover:brightness-110`}
              >
                {pending ? "…" : MODE_META[mode].label}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
