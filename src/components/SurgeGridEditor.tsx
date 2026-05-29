"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Cell { day_of_week: number; hour_of_day: number; multiplier: number; status: boolean }

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function SurgeGridEditor({ initial }: { initial: Cell[] }) {
  const router = useRouter();
  const [grid, setGrid] = useState<Record<string, Cell>>(() => Object.fromEntries(initial.map((c) => [`${c.day_of_week}-${c.hour_of_day}`, c])));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(dow: number, hr: number, multiplier: number) {
    const key = `${dow}-${hr}`;
    setGrid((g) => ({ ...g, [key]: { ...g[key], day_of_week: dow, hour_of_day: hr, multiplier, status: multiplier > 1 } }));
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/user-delivery-charges/surge-grid", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day_of_week: dow, hour_of_day: hr, multiplier, status: multiplier > 1 }),
      });
      if (!res.ok) {
        setError((await res.text()).slice(0, 120));
        router.refresh();
      }
    });
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left text-slate-500">Hour</th>
              {DAYS.map((d, i) => <th key={i} className="px-2 py-1 text-center text-slate-500">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 24 }, (_, hr) => (
              <tr key={hr}>
                <td className="px-2 py-0.5 text-right text-slate-500 font-mono">{String(hr).padStart(2, "0")}:00</td>
                {DAYS.map((_, dow) => {
                  const cell = grid[`${dow}-${hr}`];
                  const m = cell?.multiplier ?? 1;
                  const color = m === 1 ? "bg-slate-50 text-slate-500" : m < 1.5 ? "bg-amber-100 text-amber-800" : m < 2 ? "bg-orange-200 text-orange-900" : "bg-red-200 text-red-900";
                  return (
                    <td key={dow} className="px-1 py-0.5">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="3"
                        value={m}
                        onChange={(e) => update(dow, hr, parseFloat(e.target.value) || 1)}
                        disabled={pending}
                        className={`w-12 text-center rounded border border-slate-200 px-1 py-0.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${color}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        Multiplier of 1.0 = no surge. Values &gt; 1 apply the multiplier to the base+extra portion of the user delivery fee for that (day, hour) cell.
      </p>
    </div>
  );
}
