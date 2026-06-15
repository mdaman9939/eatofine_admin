"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, type FieldSpec, type FieldValue } from "./CreateForm";

/**
 * Full-page edit form. Mirrors {@link CreateForm} but is always rendered
 * (no popover toggle), pre-fills from `initialValues`, and PATCHes the record
 * instead of POSTing a new one. On success it navigates to `redirectTo`
 * (falling back to a refresh of the current route).
 *
 * Fields left blank are omitted from the request — the backend only updates
 * keys that are present, so this is a partial update (same semantics as the
 * Laravel admin's restaurant edit form).
 */
export function EditForm({
  path,
  fields,
  initialValues,
  submitLabel = "Save changes",
  redirectTo,
}: {
  /** API path appended to `/api/admin`, e.g. `/restaurants/12`. */
  path: string;
  fields: FieldSpec[];
  initialValues: Record<string, FieldValue | null | undefined>;
  submitLabel?: string;
  /** Where to send the user after a successful save. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    const init: Record<string, FieldValue> = {};
    for (const f of fields) {
      const v = initialValues[f.name];
      if (f.type === "multiselect") init[f.name] = Array.isArray(v) ? (v as number[]) : [];
      else if (f.type === "documents") init[f.name] = Array.isArray(v) ? (v as string[]) : [];
      else if (v === null || v === undefined) {
        init[f.name] = f.type === "checkbox" ? false : "";
      } else {
        init[f.name] = v;
      }
    }
    return init;
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    // Cross-field: confirm-password must match password when both are filled.
    if (
      values.password !== undefined && values.confirm_password !== undefined &&
      String(values.password) !== String(values.confirm_password)
    ) {
      setError("Passwords do not match");
      return;
    }
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.name === "confirm_password") continue; // UI-only
      const v = values[f.name];
      if (f.type === "checkbox") {
        body[f.name] = !!v;
        continue;
      }
      if (f.type === "latlng") {
        const [latStr, lngStr] = String(v ?? "").split(",");
        if (latStr?.trim()) body.latitude = latStr.trim();
        if (lngStr?.trim()) body.longitude = lngStr.trim();
        continue;
      }
      if (f.type === "multiselect" || f.type === "documents") {
        body[f.name] = Array.isArray(v) ? v : [];
        continue;
      }
      if (f.type === "variations" || f.type === "polygon") {
        try { body[f.name] = JSON.parse(String(v || "[]")); }
        catch { body[f.name] = []; }
        continue;
      }
      if (f.type === "multilang") {
        // Value is a JSON string of [{ locale, key, value }] translations.
        try { body[f.name] = JSON.parse(String(v || "[]")); }
        catch { body[f.name] = []; }
        continue;
      }
      if (f.type === "heading") continue;
      if (v === "" || v === null || v === undefined) {
        if (f.required) {
          setError(`${f.label} is required`);
          return;
        }
        // Blank optional field -> leave the stored value untouched.
        continue;
      }
      if (f.type === "number") {
        const num = typeof v === "number" ? v : parseFloat(String(v));
        if (!Number.isFinite(num)) {
          setError(`${f.label} must be a valid number`);
          return;
        }
        if (num < 0) {
          setError(`${f.label} cannot be negative — enter 0 or a positive value`);
          return;
        }
        body[f.name] = num;
      } else {
        body[f.name] = v;
      }
    }
    startTransition(async () => {
      const res = await fetch(`/api/admin${path}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text.slice(0, 200) || `Request failed (${res.status})`);
        return;
      }
      setSaved(true);
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
        {fields.map((f) => (
          f.type === "hidden" ? null : (
          <div key={f.name} className={["textarea", "multiselect", "image", "latlng", "documents", "polygon", "heading", "variations", "multilang"].includes(f.type ?? "") ? "sm:col-span-2" : ""}>
            <Field
              spec={f}
              value={values[f.name]}
              onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
            />
          </div>
          )
        ))}
      </div>

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded px-3 py-2">{error}</p>
      )}
      {saved && !error && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
          Changes saved.
        </p>
      )}

      <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="cursor-pointer rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:from-emerald-700 active:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 shadow-sm hover:shadow-md hover:shadow-emerald-500/25 transition-all duration-200"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
