"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // error.tsx redirects here with `?reason=session_expired` when the JWT
  // is rejected — show the user *why* they're back on the login screen
  // instead of silently kicking them out.
  const sessionExpired = searchParams?.get("reason") === "session_expired";
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setSubmitting(false);
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error === "invalid_credentials" ? "Invalid email or password." : "Login failed.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden sidebar-gradient">
      {/* Radial highlight orbs (same style as dashboard hero) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(110,231,183,0.45),transparent_55%)]" />
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-emerald-300/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />

      {/* Login card */}
      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-xl shadow-emerald-900/30 flex items-center justify-center mb-3 ring-1 ring-white/20">
            <span className="text-3xl font-black bg-gradient-to-br from-emerald-600 to-teal-700 bg-clip-text text-transparent">E</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Eatofine Admin</h1>
          <p className="text-sm text-white/70 mt-1">Sign in to your dashboard</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-emerald-900/20 ring-1 ring-white/30 p-7 space-y-5"
        >
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700 font-semibold mb-3">
              <span className="inline-block w-1 h-1 rounded-full bg-emerald-600" />
              Secure login
            </div>
            <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-xs text-slate-500 mt-1">Use your administrator credentials to continue.</p>
          </div>

          {sessionExpired && !error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium">Your session expired. Please sign in again.</p>
            </div>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Email</span>
            <div className="relative mt-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                placeholder="you@company.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">Password</span>
            <div className="relative mt-1">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="cursor-pointer w-full rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
          >
            {submitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                Sign in
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 text-center">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Demo: <span className="font-mono text-slate-700">admin@admin.com</span> / <span className="font-mono text-slate-700">12345678</span>
              </span>
            </p>
          </div>
        </form>

        {/* Footer caption */}
        <p className="text-center text-[11px] text-white/60 mt-6 tracking-wider uppercase font-semibold">
          Eatofine Delivery Service · Admin Panel
        </p>
      </div>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary in Next 15+, otherwise the
// page bails out of static rendering with a build warning.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
