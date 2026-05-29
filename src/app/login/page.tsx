"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white dark:bg-zinc-800 rounded-lg shadow-lg p-8 space-y-5"
      >
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Eatofine Admin
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to continue.</p>
        </div>

        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </label>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors px-4 py-2 text-white font-medium"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          Demo: admin@admin.com / 12345678
        </p>
      </form>
    </div>
  );
}
