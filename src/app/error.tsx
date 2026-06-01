"use client";

import { useEffect, useState } from "react";

// adminFetch() throws Error("not_authenticated") when the cookie is missing,
// and Error("api_error_401: ...") when the backend rejects the JWT (expired
// or revoked). In both cases the right UX is to send the user to /login —
// showing them "Something went wrong" would be misleading.
function isAuthError(message: string): boolean {
  return (
    message === "not_authenticated" ||
    message.startsWith("api_error_401") ||
    message.startsWith("api_error_403")
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const authExpired = isAuthError(error.message);
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[admin] unhandled error:", error);
  }, [error]);

  useEffect(() => {
    if (!authExpired) return;
    if (secondsLeft <= 0) {
      window.location.href = "/login?reason=session_expired";
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [authExpired, secondsLeft]);

  if (authExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center sidebar-gradient text-white p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-emerald-900/30 ring-1 ring-white/30 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 text-amber-700 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-xl font-bold text-slate-900">Session expired</h1>
          </div>
          <p className="text-sm text-slate-600 mb-5">
            Your admin session has expired. Redirecting you to login in <span className="font-semibold text-emerald-700">{secondsLeft}s</span>…
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => (window.location.href = "/login?reason=session_expired")}
              className="cursor-pointer rounded-md px-4 py-1.5 text-sm font-semibold bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-sm hover:shadow transition"
            >
              Go to login now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center sidebar-gradient text-white p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-emerald-900/30 ring-1 ring-white/30 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 text-rose-700 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
        </div>
        <p className="text-sm text-slate-600 mb-2">
          The admin panel hit an unexpected error and could not render this page.
        </p>
        {error.message && (
          <pre className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-auto whitespace-pre-wrap mb-4">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="cursor-pointer rounded-md px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            Go to dashboard
          </button>
          <button
            onClick={reset}
            className="cursor-pointer rounded-md px-4 py-1.5 text-sm font-semibold bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-sm hover:shadow transition"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
