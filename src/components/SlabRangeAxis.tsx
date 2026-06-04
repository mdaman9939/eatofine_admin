"use client";

import { useEffect, useState } from "react";

interface Slab {
  id: number;
  min_order_value: number;
  max_order_value: number;
  fixed_charge: number;
  gst_rate: number;
  status: boolean;
}

interface Gap {
  from: number;
  to: number;
  beforeId: number;
  afterId: number;
}

// Brand-aligned palette — used by both the linear axis and the pie chart so
// slab #N has the same color in both visualizations.
const SLAB_COLORS: Array<{ bar: string; hex: string }> = [
  { bar: "bg-gradient-to-b from-emerald-700 to-emerald-800", hex: "#047857" },
  { bar: "bg-gradient-to-b from-emerald-500 to-emerald-600", hex: "#10B981" },
  { bar: "bg-gradient-to-b from-teal-500 to-teal-600",       hex: "#14B8A6" },
  { bar: "bg-gradient-to-b from-green-500 to-green-600",     hex: "#22C55E" },
  { bar: "bg-gradient-to-b from-lime-500 to-lime-600",       hex: "#84CC16" },
  { bar: "bg-gradient-to-b from-cyan-500 to-cyan-600",       hex: "#06B6D4" },
  { bar: "bg-gradient-to-b from-sky-500 to-sky-600",         hex: "#0EA5E9" },
];

export function SlabRangeAxis({ slabs }: { slabs: Slab[] }) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  // Render only after mount. Number formatting (toLocaleString("en-IN"))
  // can differ between Node and the browser when ICU data is partial,
  // which trips React's hydration check. Server renders the skeleton;
  // client swaps to the real chart after first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = slabs.filter((s) => s.status).sort((a, b) => a.min_order_value - b.min_order_value);

  if (active.length === 0) {
    return null;
  }

  if (!mounted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-3 w-64 bg-slate-100 rounded animate-pulse mt-2" />
        </div>
        <div className="px-6 py-6">
          <div className="h-10 bg-slate-100 rounded-full animate-pulse" />
          <div className="flex justify-between mt-3">
            <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const minVal = Math.min(...active.map((s) => s.min_order_value));
  const maxVal = Math.max(...active.map((s) => s.max_order_value));
  const span = maxVal - minVal || 1;
  const pct = (v: number) => ((v - minVal) / span) * 100;

  // Detect gaps between adjacent slabs.
  const gaps: Gap[] = [];
  for (let i = 1; i < active.length; i++) {
    const prev = active[i - 1];
    const cur = active[i];
    if (cur.min_order_value - prev.max_order_value > 0.01) {
      gaps.push({
        from: prev.max_order_value,
        to: cur.min_order_value,
        beforeId: prev.id,
        afterId: cur.id,
      });
    }
  }

  // Pie-chart segments: each slab gets a share proportional to the range it covers.
  const pieSegments = active.map((s, i) => ({
    id: s.id,
    label: `#${s.id}`,
    value: s.max_order_value - s.min_order_value,
    color: SLAB_COLORS[i % SLAB_COLORS.length].hex,
    range: `₹${s.min_order_value.toLocaleString("en-IN")}–₹${s.max_order_value.toLocaleString("en-IN")}`,
  }));
  const pieTotal = pieSegments.reduce((a, s) => a + s.value, 0) || 1;

  const summaryText =
    gaps.length === 0
      ? `${active.length} active slabs covering ₹${minVal.toLocaleString("en-IN")} – ₹${maxVal.toLocaleString("en-IN")} with no gaps.`
      : `${active.length} active slabs · ${gaps.length} ${gaps.length === 1 ? "gap" : "gaps"} detected.`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Coverage map</h2>
          <p className="text-xs text-slate-500 mt-0.5">{summaryText}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <Legend swatch="bg-slate-300" label="Range scale" />
          {gaps.length > 0 && <Legend swatch="bg-amber-400" label={`${gaps.length} gap${gaps.length === 1 ? "" : "s"}`} />}
        </div>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
        {/* ── Linear axis + gap warnings ─────────────────────── */}
        <div className="space-y-4 min-w-0">
          <div className="relative">
            <div className="relative h-10 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200">
              {active.map((s, i) => {
                const left = pct(s.min_order_value);
                const width = pct(s.max_order_value) - left;
                const color = SLAB_COLORS[i % SLAB_COLORS.length].bar;
                const hover = hoverId === s.id;
                return (
                  <div
                    key={s.id}
                    onMouseEnter={() => setHoverId(s.id)}
                    onMouseLeave={() => setHoverId(null)}
                    className={`absolute top-0 bottom-0 ${color} ${hover ? "opacity-100 ring-2 ring-white" : "opacity-90"} transition-opacity cursor-default`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={`Slab #${s.id} · ₹${s.min_order_value} – ₹${s.max_order_value} · Fixed ₹${s.fixed_charge}`}
                  >
                    <div className="h-full flex items-center justify-center text-[10px] font-bold text-white/95 px-1 truncate">
                      #{s.id}
                    </div>
                  </div>
                );
              })}

              {gaps.map((g, i) => (
                <div
                  key={`gap-${i}`}
                  className="absolute top-0 bottom-0 bg-amber-300/60 border-x border-amber-500/50"
                  style={{
                    left: `${pct(g.from)}%`,
                    width: `${Math.max(0.4, pct(g.to) - pct(g.from))}%`,
                  }}
                  title={`Gap ₹${g.from} – ₹${g.to}`}
                />
              ))}
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2">
              <span>₹{minVal.toLocaleString("en-IN")}</span>
              <span>₹{((minVal + maxVal) / 2).toLocaleString("en-IN")}</span>
              <span>₹{maxVal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {gaps.length > 0 && (
            <div className="space-y-2">
              {gaps.map((g, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs"
                >
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <span className="font-semibold">Gap: ₹{g.from.toFixed(2)} – ₹{g.to.toFixed(2)}.</span>{" "}
                    <span>Orders in this range won&apos;t match slab #{g.beforeId} or #{g.afterId}.</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Range distribution pie ─────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <Pie
            segments={pieSegments.map((s) => ({ value: s.value, color: s.color, label: s.label }))}
            total={pieTotal}
            hoverId={hoverId}
            onHover={(idx) => setHoverId(idx !== null ? active[idx].id : null)}
          />
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Range distribution</div>
          <div className="space-y-1 w-full max-w-[200px]">
            {pieSegments.map((s) => {
              const sharePct = (s.value / pieTotal) * 100;
              const isHover = hoverId === s.id;
              return (
                <div
                  key={s.id}
                  onMouseEnter={() => setHoverId(s.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md transition-colors ${isHover ? "bg-slate-100" : ""}`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                  <span className="text-slate-700 font-medium">{s.label}</span>
                  <span className="text-slate-400 truncate">{s.range}</span>
                  <span className="ml-auto font-mono text-slate-700 font-semibold">{sharePct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pie({
  segments,
  total,
  hoverId,
  onHover,
}: {
  segments: Array<{ value: number; color: string; label: string }>;
  total: number;
  hoverId: number | null;
  onHover: (idx: number | null) => void;
}) {
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const innerR = 44; // hollow center → donut
  let cumulative = 0;

  function arcPath(startFrac: number, endFrac: number): string {
    const startAngle = startFrac * 2 * Math.PI - Math.PI / 2;
    const endAngle = endFrac * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const xi1 = cx + innerR * Math.cos(endAngle);
    const yi1 = cy + innerR * Math.sin(endAngle);
    const xi2 = cx + innerR * Math.cos(startAngle);
    const yi2 = cy + innerR * Math.sin(startAngle);
    const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi2} ${yi2} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={(r + innerR) / 2} fill="none" stroke="#F1F5F9" strokeWidth={r - innerR} />

      {segments.map((s, i) => {
        const startFrac = cumulative / total;
        const endFrac = (cumulative + s.value) / total;
        cumulative += s.value;
        const isHover = hoverId !== null && i === segments.findIndex((seg) => seg.label === `#${hoverId}`);
        return (
          <path
            key={i}
            d={arcPath(startFrac, endFrac)}
            fill={s.color}
            opacity={isHover ? 1 : 0.92}
            stroke="white"
            strokeWidth={2}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            className="cursor-pointer transition-opacity"
          >
            <title>{s.label}: {((s.value / total) * 100).toFixed(1)}%</title>
          </path>
        );
      })}

      <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-500" fontSize="9" fontWeight="600" style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Slabs
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-900" fontSize="20" fontWeight="700">
        {segments.length}
      </text>
    </svg>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${swatch}`} />
      {label}
    </span>
  );
}
