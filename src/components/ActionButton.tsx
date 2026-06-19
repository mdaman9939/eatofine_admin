"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Method = "POST" | "PATCH" | "DELETE";

const VARIANT_CLASSES: Record<string, string> = {
  default:
    "bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-white shadow-sm hover:shadow",
  primary:
    "bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-800 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20",
  danger:
    "bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:from-rose-700 active:to-rose-800 text-white shadow-sm hover:shadow-md hover:shadow-rose-500/20",
  subtle:
    "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 border border-slate-200 shadow-sm",
};

export function ActionButton({
  path,
  method,
  body,
  label,
  confirm,
  variant = "default",
  className = "",
}: {
  path: string;
  method: Method;
  body?: unknown;
  label: string;
  confirm?: string;
  variant?: "default" | "danger" | "primary" | "subtle";
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (confirm && !window.confirm(confirm)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin${path}`, {
        method,
        headers: { "content-type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text();
        // Surface the human message from a `{errors:[{message}]}` payload
        // rather than dumping raw JSON next to the button.
        let msg = text;
        try {
          const j = JSON.parse(text);
          msg = j?.errors?.[0]?.message ?? j?.message ?? text;
        } catch { /* not JSON — show as-is */ }
        setError(String(msg).slice(0, 160));
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      >
        {pending ? "…" : label}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}

export function ToggleStatusButton({
  basePath,
  id,
  currentStatus,
  field = "status",
  mode = "status-path",
}: {
  basePath: string;
  id: number;
  currentStatus: boolean;
  field?: string;
  /** "status-path" -> PATCH basePath/:id/status. "base-path" -> PATCH basePath/:id */
  mode?: "status-path" | "base-path";
}) {
  const path = mode === "status-path" ? `${basePath}/${id}/status` : `${basePath}/${id}`;
  return (
    <ActionButton
      path={path}
      method="PATCH"
      body={{ [field]: !currentStatus }}
      label={currentStatus ? "Disable" : "Enable"}
      variant={currentStatus ? "subtle" : "primary"}
    />
  );
}

export function DeleteButton({ basePath, id }: { basePath: string; id: number }) {
  return (
    <ActionButton
      path={`${basePath}/${id}`}
      method="DELETE"
      label="Delete"
      variant="danger"
      confirm="Delete this item? This cannot be undone."
    />
  );
}
