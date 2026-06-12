"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./ImageUpload";
import { MapPicker } from "./MapPicker";
import { MultiLangInput } from "./MultiLangInput";
import { ZonePolygonPicker } from "./ZonePolygonPicker";
import { VariationsInput } from "./VariationsInput";

export type FieldValue = string | number | boolean | number[] | string[];

export interface FieldSpec {
  name: string;
  label: string;
  type?: "text" | "password" | "number" | "date" | "textarea" | "select" | "multiselect" | "checkbox" | "image" | "documents" | "latlng" | "multilang" | "polygon" | "heading" | "variations";
  /** For type=multilang: which translation key this field edits (e.g. "name"). */
  langKey?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  /** For type=image: which storage subdir to upload to (banner / restaurant / category / etc.) */
  imageDir?: string;
  /** For type=text: show a "Generate" button that fills a random code. */
  generate?: boolean;
  /** For a dependent type=select: the field whose value picks this select's
   *  options (e.g. Sub Category options depend on the chosen Category). */
  parentField?: string;
  /** For a dependent select: parent value (as string) → option list. */
  optionsByParent?: Record<string, Array<{ value: string; label: string }>>;
}

export function CreateForm({
  path,
  fields,
  title,
  submitLabel = "Create",
  embedded = false,
  wide = false,
  redirectTo,
}: {
  path: string;
  fields: FieldSpec[];
  title?: string;
  submitLabel?: string;
  /** Render as a full-width, always-open page form (no popover toggle). */
  embedded?: boolean;
  /** Keep the collapsible toggle, but render the open form full-width and
   *  multi-column (instead of the narrow md:w-96 single column). */
  wide?: boolean;
  /** Where to navigate after a successful create (embedded mode). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(embedded);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    const init: Record<string, FieldValue> = {};
    for (const f of fields) {
      if (f.type === "multiselect" || f.type === "documents") init[f.name] = [];
      else if (f.defaultValue !== undefined) init[f.name] = f.defaultValue;
      else if (f.type === "checkbox") init[f.name] = false;
      else if (f.type === "number") init[f.name] = "";
      else init[f.name] = "";
    }
    return init;
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Cross-field: a confirm-password field must match the password field.
    if (
      values.password !== undefined && values.confirm_password !== undefined &&
      String(values.password) !== String(values.confirm_password)
    ) {
      setError("Passwords do not match");
      return;
    }
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      // confirm_password is a UI-only check — never sent to the API.
      if (f.name === "confirm_password") continue;
      if (f.type === "heading") continue; // section label, no value
      const v = values[f.name];
      if (f.type === "multiselect" || f.type === "documents") {
        const arr = Array.isArray(v) ? v : [];
        if (arr.length === 0) {
          if (f.required) {
            setError(`${f.label} is required`);
            return;
          }
          continue;
        }
        body[f.name] = arr;
        continue;
      }
      if (f.type === "latlng") {
        // Stored as "lat,lng" — split into the two body keys the API expects.
        const [latStr, lngStr] = String(v ?? "").split(",");
        if (latStr?.trim()) body.latitude = latStr.trim();
        if (lngStr?.trim()) body.longitude = lngStr.trim();
        continue;
      }
      if (f.type === "multilang") {
        // Value is a JSON string of [{ locale, key, value }] translations.
        try {
          const arr = JSON.parse(String(v || "[]"));
          if (Array.isArray(arr) && arr.length) body[f.name] = arr;
        } catch { /* ignore malformed */ }
        continue;
      }
      if (f.type === "polygon" || f.type === "variations") {
        // Value is a JSON string of an array (polygon points / variation groups).
        try {
          const arr = JSON.parse(String(v || "[]"));
          body[f.name] = Array.isArray(arr) ? arr : [];
        } catch { body[f.name] = []; }
        continue;
      }
      if (v === "" || v === null || v === undefined) {
        if (f.required) {
          setError(`${f.label} is required`);
          return;
        }
        continue;
      }
      if (f.type === "number") {
        const num = typeof v === "number" ? v : parseFloat(String(v));
        // Reject negatives — charges/quantities/percentages are all ≥ 0.
        // The browser's native `min=0` blocks arrow keys but a user can
        // still paste/type "-5", so we re-check here on submit.
        if (!Number.isFinite(num)) {
          setError(`${f.label} must be a valid number`);
          return;
        }
        if (num < 0) {
          setError(`${f.label} cannot be negative — enter 0 or a positive value`);
          return;
        }
        body[f.name] = num;
      } else body[f.name] = v;
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
      if (embedded && redirectTo) {
        router.push(redirectTo);
      } else if (!embedded) {
        setOpen(false);
      }
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
      className={`bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden ${embedded || wide ? "w-full" : "w-full md:w-96"}`}
    >
      <div className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide">{title ?? "Create"}</h3>
        {!embedded && (
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
        )}
      </div>
      <div className={embedded || wide ? "px-5 py-4 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-x-5 gap-y-3.5" : "px-5 py-4 space-y-3.5"}>
        {fields.map((f) => {
          // Dependent select: narrow options to the chosen parent's value.
          const spec = (f.type === "select" && f.parentField && f.optionsByParent)
            ? { ...f, options: f.optionsByParent[String(values[f.parentField] ?? "")] ?? [] }
            : f;
          return (
            <div key={f.name} className={(embedded || wide) && ["textarea", "multiselect", "image", "latlng", "documents", "polygon", "heading", "variations", "multilang"].includes(f.type ?? "") ? "col-span-full" : ""}>
              <Field
                spec={spec}
                value={values[f.name]}
                onChange={(v) => setValues((s) => {
                  const next = { ...s, [f.name]: v };
                  // Reset any select that depends on this field (stale sub-choice).
                  for (const df of fields) {
                    if (df.parentField === f.name) next[df.name] = "";
                  }
                  return next;
                })}
              />
            </div>
          );
        })}
        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-2 py-1.5 col-span-full">{error}</p>
        )}
      </div>
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => (embedded ? router.back() : setOpen(false))}
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

export function Field({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  const labelEl = (
    <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
      {spec.label}
      {spec.required && <span className="text-rose-500 ml-0.5">*</span>}
    </span>
  );

  if (spec.type === "latlng") {
    return <MapPicker value={typeof value === "string" ? value : ""} onChange={(v) => onChange(v)} label={spec.label} />;
  }

  if (spec.type === "multilang") {
    return <MultiLangInput value={typeof value === "string" ? value : ""} onChange={(v) => onChange(v)} label={spec.label} fieldKey={spec.langKey ?? "name"} />;
  }

  if (spec.type === "polygon") {
    return <ZonePolygonPicker value={typeof value === "string" ? value : ""} onChange={(v) => onChange(v)} label={spec.label} />;
  }

  if (spec.type === "heading") {
    return (
      <div className="pt-2 pb-1 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{spec.label}</h3>
      </div>
    );
  }

  if (spec.type === "variations") {
    return <VariationsInput value={typeof value === "string" ? value : ""} onChange={(v) => onChange(v)} label={spec.label} />;
  }

  if (spec.type === "documents") {
    const files = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{spec.label}</span>
        <div className="flex flex-wrap gap-2">
          {files.map((fn, i) => (
            <span key={fn + i} className="inline-flex items-center gap-1 text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1">
              {fn.slice(0, 24)}
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} className="text-rose-600 hover:text-rose-700">×</button>
            </span>
          ))}
        </div>
        <ImageUpload
          dir={spec.imageDir ?? "restaurant"}
          value={null}
          onChange={(fn) => { if (fn) onChange([...files, fn]); }}
          label="Add document"
        />
      </div>
    );
  }

  if (spec.type === "multiselect") {
    const selected = Array.isArray(value) ? (value as number[]) : [];
    const toggle = (val: number) =>
      onChange(selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val]);
    return (
      <label className="block">
        {labelEl}
        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2 grid grid-cols-2 gap-1">
          {spec.options?.length ? (
            spec.options.map((o) => {
              const val = Number(o.value);
              const on = selected.includes(val);
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => toggle(val)}
                  className={`text-left text-xs rounded px-2 py-1 transition-colors ${on ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                >
                  {on ? "✓ " : ""}{o.label}
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 col-span-2 px-1">No options</span>
          )}
        </div>
      </label>
    );
  }

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
      <div className={spec.generate ? "mt-1 flex gap-2" : ""}>
        <input
          type={spec.type ?? "text"}
          autoComplete={spec.type === "password" ? "new-password" : undefined}
          className={spec.generate ? cls.replace("mt-1", "") + " flex-1" : cls}
          value={String(value ?? "")}
          placeholder={spec.placeholder}
          // Number-input guardrails: `min=0` blocks the browser's arrow-down
          // past zero; `step=any` keeps decimals (₹102.45 still valid);
          // `onKeyDown` swallows the `-` key so typing a leading minus does
          // nothing. Pasted negatives are caught by the submit check.
          min={spec.type === "number" ? 0 : undefined}
          step={spec.type === "number" ? "any" : undefined}
          onKeyDown={spec.type === "number" ? (e) => {
            if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
          } : undefined}
          onChange={(e) => onChange(spec.type === "number" ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value)}
        />
        {spec.generate && (
          <button
            type="button"
            onClick={() => onChange(generateCode())}
            className="shrink-0 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-3 border border-amber-200"
          >
            ✨ Generate
          </button>
        )}
      </div>
    </label>
  );
}

/** Random uppercase coupon code, e.g. "SAVEK7Q9X". */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SAVE${s}`;
}
