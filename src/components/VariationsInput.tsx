"use client";

import { useState } from "react";

interface VariationValue { label: string; optionPrice: string }
interface VariationGroup {
  name: string;
  type: "single" | "multi";
  required: boolean;
  min: number;
  max: number;
  values: VariationValue[];
}

const SIZE_PRESETS = ["Half", "Full", "Small", "Medium", "Large"];

/**
 * Food variations editor (StackFood-style). A food can have variation groups
 * (e.g. "Size") each with options (Half / Full / Small / Medium / Large …),
 * every option carrying its own price. Stored as a JSON string of the groups.
 */
export function VariationsInput({
  value,
  onChange,
  label = "Food variations",
}: {
  value: string;
  onChange: (jsonValue: string) => void;
  label?: string;
}) {
  const [groups, setGroups] = useState<VariationGroup[]>(() => parse(value));

  function commit(next: VariationGroup[]) {
    setGroups(next);
    onChange(JSON.stringify(next));
  }

  function addGroup() {
    commit([...groups, { name: "Size", type: "single", required: true, min: 1, max: 1, values: [] }]);
  }
  function removeGroup(gi: number) {
    commit(groups.filter((_, i) => i !== gi));
  }
  function setGroup(gi: number, patch: Partial<VariationGroup>) {
    commit(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  }
  function addValue(gi: number, label = "") {
    setGroup(gi, { values: [...groups[gi].values, { label, optionPrice: "0" }] });
  }
  function setValue(gi: number, vi: number, patch: Partial<VariationValue>) {
    setGroup(gi, { values: groups[gi].values.map((v, i) => (i === vi ? { ...v, ...patch } : v)) });
  }
  function removeValue(gi: number, vi: number) {
    setGroup(gi, { values: groups[gi].values.filter((_, i) => i !== vi) });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{label}</span>
        <button type="button" onClick={addGroup} className="text-xs font-semibold text-emerald-700 hover:underline">+ Add variation</button>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-slate-400">No variations. Add one (e.g. &quot;Size&quot; with Half / Full / Small / Medium / Large).</p>
      )}

      {groups.map((g, gi) => (
        <div key={gi} className="rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={g.name}
              onChange={(e) => setGroup(gi, { name: e.target.value })}
              placeholder="Variation name (e.g. Size)"
              className="flex-1 min-w-[140px] rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
            <select
              value={g.type}
              onChange={(e) => setGroup(gi, { type: e.target.value as "single" | "multi" })}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="single">Single choice</option>
              <option value="multi">Multiple choice</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input type="checkbox" checked={g.required} onChange={(e) => setGroup(gi, { required: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600" />
              Required
            </label>
            <button type="button" onClick={() => removeGroup(gi)} className="text-xs text-rose-600 hover:underline ml-auto">Remove</button>
          </div>

          {/* Quick-add size presets */}
          <div className="flex flex-wrap gap-1">
            <span className="text-[11px] text-slate-400 self-center mr-1">Quick add:</span>
            {SIZE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => addValue(gi, p)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700"
              >
                {p}
              </button>
            ))}
            <button type="button" onClick={() => addValue(gi)} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700">+ Custom</button>
          </div>

          {/* Options */}
          <div className="space-y-1.5">
            {g.values.map((v, vi) => (
              <div key={vi} className="flex items-center gap-2">
                <input
                  value={v.label}
                  onChange={(e) => setValue(gi, vi, { label: e.target.value })}
                  placeholder="Option (e.g. Half)"
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={v.optionPrice}
                    onChange={(e) => setValue(gi, vi, { optionPrice: e.target.value })}
                    placeholder="Price"
                    className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-right"
                  />
                </div>
                <button type="button" onClick={() => removeValue(gi, vi)} className="text-rose-500 hover:text-rose-700 text-sm px-1">×</button>
              </div>
            ))}
            {g.values.length === 0 && <p className="text-[11px] text-amber-600">Add at least one option.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function parse(value: string | undefined): VariationGroup[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    if (!Array.isArray(arr)) return [];
    return arr.map((g) => ({
      name: String(g?.name ?? "Size"),
      type: g?.type === "multi" ? "multi" : "single",
      required: !!g?.required,
      min: Number(g?.min ?? 1),
      max: Number(g?.max ?? 1),
      values: Array.isArray(g?.values)
        ? g.values.map((v: { label?: unknown; optionPrice?: unknown }) => ({ label: String(v?.label ?? ""), optionPrice: String(v?.optionPrice ?? "0") }))
        : [],
    }));
  } catch {
    return [];
  }
}
