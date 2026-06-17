"use client";

import { useEffect, useRef, useState } from "react";
import { loadLeaflet, type LatLng, type LeafletMap } from "../lib/leaflet";

type Mode = "polygon" | "rectangle" | "circle";

function parse(value: string | undefined): LatLng[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number") : [];
  } catch {
    return [];
  }
}

const r6 = (n: number) => Number(n.toFixed(6));

/** Great-circle distance between two points, in metres. */
function distM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Four corners of the axis-aligned rectangle spanned by two opposite corners. */
function rectCorners(a: LatLng, b: LatLng): LatLng[] {
  return [
    { lat: r6(a.lat), lng: r6(a.lng) },
    { lat: r6(a.lat), lng: r6(b.lng) },
    { lat: r6(b.lat), lng: r6(b.lng) },
    { lat: r6(b.lat), lng: r6(a.lng) },
  ];
}

/**
 * Approximate a circle (centre → edge point) as a polygon of `segments` points.
 * The zone is stored as a polygon, so a circle drawn by the admin is converted
 * here — what they see is exactly what gets saved.
 */
function circlePolygon(center: LatLng, edge: LatLng, segments = 48): LatLng[] {
  const R = 6371000;
  const d = distM(center, edge);
  const dr = d / R;
  const lat1 = (center.lat * Math.PI) / 180;
  const lon1 = (center.lng * Math.PI) / 180;
  const pts: LatLng[] = [];
  for (let i = 0; i < segments; i++) {
    const brng = (2 * Math.PI * i) / segments;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(brng));
    const lon2 =
      lon1 + Math.atan2(Math.sin(brng) * Math.sin(dr) * Math.cos(lat1), Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2));
    pts.push({ lat: r6((lat2 * 180) / Math.PI), lng: r6((lon2 * 180) / Math.PI) });
  }
  return pts;
}

/**
 * Fully customisable zone coverage picker (StackFood-style).
 *  • Search a place/area by name → the map flies there (OpenStreetMap geocoding).
 *  • Draw the zone as a Polygon (any shape — triangle, pentagon, …), a Rectangle,
 *    or a Circle. Every shape is stored as a JSON polygon `[{lat,lng}, …]`, so the
 *    backend geofence stays unchanged regardless of how the admin drew it.
 */
export function ZonePolygonPicker({
  value,
  onChange,
  label = "Zone coverage area",
}: {
  value: string;
  onChange: (jsonValue: string) => void;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layersRef = useRef<unknown[]>([]);
  const [points, setPoints] = useState<LatLng[]>(() => parse(value));
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const [mode, setMode] = useState<Mode>("polygon");
  const [anchor, setAnchor] = useState<LatLng | null>(null); // first click for rectangle/circle
  const modeRef = useRef<Mode>(mode);
  const anchorRef = useRef<LatLng | null>(anchor);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { anchorRef.current = anchor; }, [anchor]);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  type Suggestion = { display_name: string; lat: string; lon: string };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const skipNextRef = useRef(false); // don't re-query right after picking a suggestion

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const center: [number, number] = points.length
          ? [points[0].lat, points[0].lng]
          : [20.5937, 78.9629]; // India centroid as a sensible default
        const map = L.map(containerRef.current).setView(center, points.length ? 13 : 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
        map.on("click", (e) => {
          const ll: LatLng = { lat: r6(e.latlng.lat), lng: r6(e.latlng.lng) };
          const m = modeRef.current;
          if (m === "polygon") {
            setPoints((prev) => {
              const next = [...prev, ll];
              onChange(JSON.stringify(next));
              return next;
            });
            return;
          }
          // rectangle / circle: two-click (anchor, then edge).
          const a = anchorRef.current;
          if (!a) {
            setAnchor(ll);
            return;
          }
          const next = m === "rectangle" ? rectCorners(a, ll) : circlePolygon(a, ll);
          setAnchor(null);
          setPoints(next);
          onChange(JSON.stringify(next));
        });
        mapRef.current = map;
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers + polygon + pending anchor whenever they change.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;
    for (const layer of layersRef.current) map.removeLayer(layer);
    layersRef.current = [];
    points.forEach((p) => {
      const marker = L.circleMarker([p.lat, p.lng], { radius: 5, color: "#0d9488", fillColor: "#10b981", fillOpacity: 1 });
      map.addLayer(marker);
      layersRef.current.push(marker);
    });
    if (points.length >= 3) {
      const poly = L.polygon(points.map((p) => [p.lat, p.lng] as [number, number]), { color: "#0d9488", fillColor: "#10b981", fillOpacity: 0.2 });
      map.addLayer(poly);
      layersRef.current.push(poly);
    }
    if (anchor) {
      const a = L.circleMarker([anchor.lat, anchor.lng], { radius: 6, color: "#f59e0b", fillColor: "#fbbf24", fillOpacity: 1 });
      map.addLayer(a);
      layersRef.current.push(a);
    }
  }, [points, anchor]);

  // Live autocomplete: debounce typing → fetch up to 5 place suggestions.
  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } },
        );
        const data = (await r.json()) as Suggestion[];
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  function flyTo(lat: number, lon: number, name?: string) {
    mapRef.current?.setView([lat, lon], 14);
    setSearchMsg(name ? `📍 ${name}` : "");
    setSuggestions([]);
  }
  function selectSuggestion(s: Suggestion) {
    skipNextRef.current = true; // setQuery below shouldn't trigger another lookup
    setQuery(s.display_name);
    flyTo(parseFloat(s.lat), parseFloat(s.lon), s.display_name);
  }

  function pickMode(m: Mode) {
    setMode(m);
    setAnchor(null);
  }
  function undo() {
    setAnchor(null);
    setPoints((prev) => {
      const next = prev.slice(0, -1);
      onChange(JSON.stringify(next));
      return next;
    });
  }
  function clear() {
    setAnchor(null);
    setPoints([]);
    onChange("[]");
  }
  function locate() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }
  async function searchPlace() {
    const q = query.trim();
    if (!q || !mapRef.current) return;
    // If suggestions are already loaded, just fly to the best one.
    if (suggestions[0]) {
      selectSuggestion(suggestions[0]);
      return;
    }
    setSearching(true);
    setSearchMsg("");
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await r.json()) as Suggestion[];
      if (data?.[0]) {
        flyTo(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
      } else {
        setSearchMsg("No place found — try a fuller name (area, city).");
      }
    } catch {
      setSearchMsg("Search failed — check your connection.");
    } finally {
      setSearching(false);
    }
  }

  const modeBtn = (m: Mode, icon: string, text: string) => (
    <button
      type="button"
      onClick={() => pickMode(m)}
      className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition ${
        mode === m
          ? "bg-emerald-600 text-white border-emerald-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
      }`}
    >
      {icon} {text}
    </button>
  );

  const hint =
    mode === "polygon"
      ? `Click the map to add boundary points — any shape (triangle, pentagon, …). ${points.length} point${points.length === 1 ? "" : "s"}.`
      : mode === "rectangle"
        ? anchor
          ? "Now click the opposite corner to finish the rectangle."
          : "Click one corner, then the opposite corner."
        : anchor
          ? "Now click a point on the edge to set the radius."
          : "Click the centre, then a point on the edge.";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{label}</span>
        <div className="flex gap-1.5">
          <button type="button" onClick={locate} className="text-xs font-semibold text-emerald-700 hover:underline">📍 Locate</button>
          <button type="button" onClick={undo} disabled={!points.length} className="text-xs font-semibold text-slate-600 hover:underline disabled:opacity-40">Undo</button>
          <button type="button" onClick={clear} disabled={!points.length && !anchor} className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40">Clear</button>
        </div>
      </div>

      {/* Location search (NOT a <form> — this sits inside the parent zone form,
          and a nested form would make the button submit/reload the page). */}
      <div className="relative flex gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void searchPlace();
            }
          }}
          placeholder="Search a location / area name (e.g. Connaught Place, Delhi)"
          className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
        />
        <button
          type="button"
          onClick={() => void searchPlace()}
          disabled={searching || !query.trim()}
          className="rounded-md bg-emerald-600 text-white text-sm font-semibold px-3 py-1.5 disabled:opacity-50"
        >
          {searching ? "…" : "Search"}
        </button>
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 z-[1000] bg-white border border-slate-200 rounded-md shadow-lg max-h-56 overflow-auto">
            {suggestions.map((s, i) => (
              <li key={`${s.lat},${s.lon},${i}`}>
                <button
                  type="button"
                  // onMouseDown fires before the input's blur, so the pick isn't lost.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(s);
                  }}
                  className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-emerald-50 border-b border-slate-50 last:border-0"
                >
                  {s.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {searchMsg && <p className="text-xs text-slate-500 truncate">{searchMsg}</p>}

      {/* Draw-mode toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">Draw:</span>
        {modeBtn("polygon", "▱", "Polygon")}
        {modeBtn("rectangle", "▭", "Rectangle")}
        {modeBtn("circle", "◯", "Circle")}
      </div>

      <div className="rounded-lg overflow-hidden border border-slate-200 relative">
        <div ref={containerRef} className="w-full h-72 bg-slate-100" />
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none">Loading map…</div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-rose-500 bg-white/80 p-4 text-center">
            Map could not load. You can still create the zone — draw the coverage later.
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">{hint}</p>
      {mode === "polygon" && points.length > 0 && points.length < 3 && (
        <p className="text-xs text-amber-600">Add at least 3 points to form a coverage polygon.</p>
      )}
    </div>
  );
}
