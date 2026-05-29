"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./ImageUpload";

export interface FieldSpec {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select" | "checkbox" | "image";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  /** For type=image: which storage subdir to upload to (banner / restaurant / category / etc.) */
  imageDir?: string;
}

export function CreateForm({
  path,
  fields,
  title,
  submitLabel = "Create",
}: {
  path: string;
  fields: FieldSpec[];
  title?: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => {
    const init: Record<string, string | number | boolean> = {};
    for (const f of fields) {
      if (f.defaultValue !== undefined) init[f.name] = f.defaultValue;
      else if (f.type === "checkbox") init[f.name] = false;
      else if (f.type === "number") init[f.name] = "";
      else init[f.name] = "";
    }
    return init;
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (v === "" || v === null || v === undefined) {
        if (f.required) {
          setError(`${f.label} is required`);
          return;
        }
        continue;
      }
      if (f.type === "number") body[f.name] = typeof v === "number" ? v : parseFloat(String(v));
      else body[f.name] = v;
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 200));
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-800 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
        </svg>
        {title ?? "New"}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 w-full md:w-96 overflow-hidden"
    >
      <div className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">{title ?? "Create"}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer text-white/70 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-5 py-4 space-y-3.5">
        {fields.map((f) => (
          <Field
            key={f.name}
            spec={f}
            value={values[f.name]}
            onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
          />
        ))}
        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5">{error}</p>
        )}
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5 shadow-sm hover:shadow transition-all duration-200"
        >
          {pending ? "…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: string | number | boolean | undefined;
  onChange: (v: string | number | boolean) => void;
}) {
  const labelEl = (
    <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
      {spec.label}
      {spec.required && <span className="text-rose-500 ml-0.5">*</span>}
    </span>
  );
  const cls =
    "block w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all";

  if (spec.type === "select") {
    return (
      <label className="block">
        {labelEl}
        <select className={cls} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {spec.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (spec.type === "textarea") {
    return (
      <label className="block">
        {labelEl}
        <textarea
          className={cls + " min-h-[70px]"}
          value={String(value ?? "")}
          placeholder={spec.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }
  if (spec.type === "checkbox") {
    return (
      <label className="flex items-center gap-2.5 text-sm select-none cursor-pointer group">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
        />
        <span className="text-slate-700 group-hover:text-slate-900 transition-colors">{spec.label}</span>
      </label>
    );
  }
  if (spec.type === "image") {
    return (
      <ImageUpload
        dir={spec.imageDir ?? "banner"}
        value={typeof value === "string" && value !== "" ? value : null}
        onChange={(v) => onChange(v ?? "")}
        label={spec.label}
      />
    );
  }
  return (
    <label className="block">
      {labelEl}
      <input
        type={spec.type ?? "text"}
        className={cls}
        value={String(value ?? "")}
        placeholder={spec.placeholder}
        onChange={(e) => onChange(spec.type === "number" ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value)}
      />
    </label>
  );
}
