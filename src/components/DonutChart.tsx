import React from "react";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    `L ${cx} ${cy}`,
    "Z",
  ].join(" ");
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function DonutChart({
  slices,
  size = 180,
  thickness = 38,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR - thickness;
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#e2e8f0" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={innerR} fill="white" />
          <text x={cx} y={cy + 4} textAnchor="middle" className="fill-slate-400 text-xs font-semibold">
            No data
          </text>
        </svg>
      </div>
    );
  }

  let cursor = 0;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size}>
        {slices.map((s, i) => {
          const value = Math.max(0, s.value);
          if (value === 0) return null;
          const portion = (value / total) * 360;
          const startAngle = cursor;
          const endAngle = cursor + portion;
          cursor = endAngle;
          return (
            <path
              key={i}
              d={arcPath(cx, cy, outerR, startAngle, endAngle)}
              fill={s.color}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx={cx} cy={cy} r={innerR} fill="white" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerLabel && (
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{centerLabel}</span>
        )}
        {centerValue !== undefined && (
          <span className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">{centerValue}</span>
        )}
      </div>
    </div>
  );
}

export function DonutLegend({ slices, total }: { slices: DonutSlice[]; total?: number }) {
  const sum = total ?? slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <ul className="space-y-2 text-sm">
      {slices.map((s, i) => {
        const pct = sum > 0 ? Math.round((s.value / sum) * 100) : 0;
        return (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
              <span>{s.label}</span>
            </span>
            <span className="tabular-nums text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{s.value.toLocaleString("en-IN")}</span>
              <span className="ml-2">{pct}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export const DONUT_PALETTE = {
  emerald: "#10b981",
  teal: "#14b8a6",
  emeraldLight: "#6ee7b7",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#94a3b8",
  sky: "#0ea5e9",
  indigo: "#6366f1",
};
