"use client";

import { useState, useTransition } from "react";

export function ImageUpload({
  dir,
  value,
  onChange,
  label = "Image",
}: {
  dir: string;
  value: string | null;
  onChange: (filename: string | null) => void;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Use NEXT_PUBLIC_API_BASE_URL when present (production), otherwise
  // assume the dev server is on the same host port 3000. Strip the trailing
  // `/api/v1` if present so we end up with the backend's origin.
  const NODE_PUBLIC = (() => {
    const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envBase) return envBase.replace(/\/api\/v1\/?$/, '');
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return 'https://eatofine-backend.onrender.com';
  })();

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await fetch(`/api/admin/upload?dir=${encodeURIComponent(dir)}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 120));
        return;
      }
      const data = (await res.json()) as { filename: string };
      onChange(data.filename);
    });
  }

  return (
    <div className="space-y-1">
      <span className="text-xs text-zinc-600 dark:text-zinc-300">{label}</span>
      {value ? (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${NODE_PUBLIC}/storage/${dir}/${value}`}
            alt={value}
            className="w-16 h-16 rounded object-cover bg-zinc-100 border border-zinc-200"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-rose-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={onPick}
            disabled={pending}
            className="text-xs text-zinc-600 file:mr-2 file:rounded file:border-0 file:bg-orange-600 file:text-white file:px-2 file:py-1 file:text-xs"
          />
          {pending && <span className="text-xs text-zinc-500">uploading…</span>}
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
