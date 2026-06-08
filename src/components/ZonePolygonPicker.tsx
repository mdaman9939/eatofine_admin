"use client";

import { useEffect, useRef, useState } from "react";
import { loadLeaflet, type LatLng, type LeafletMap } from "../lib/leaflet";

function parse(value: string | undefined): LatLng[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number") : [];
  } catch {
    return [];
  }
}

/**
 * Draw-on-map zone coverage picker. Click the map to drop boundary points;
 * they form the zone polygon (the geofence a customer's location is matched
 * against). Stores the value as a JSON string of `[{lat,lng}, …]`.
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
          setPoints((prev) => {
            const next = [...prev, { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }];
            onChange(JSON.stringify(next));
            return next;
          });
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

  // Redraw markers + polygon whenever points change.
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;
    for (const layer of layersRef.current) map.removeLayer(layer);
    layersRef.current = [];
    points.forEach((p, i) => {
      const marker = L.circleMarker([p.lat, p.lng], { radius: 5, color: "#0d9488", fillColor: "#10b981", fillOpacity: 1 });
      map.addLayer(marker);
      layersRef.current.push(marker);
      void i;
    });
    if (points.length >= 3) {
      const poly = L.polygon(points.map((p) => [p.lat, p.lng] as [number, number]), { color: "#0d9488", fillColor: "#10b981", fillOpacity: 0.2 });
      map.addLayer(poly);
      layersRef.current.push(poly);
    }
  }, [points]);

  function undo() {
    setPoints((prev) => {
      const next = prev.slice(0, -1);
      onChange(JSON.stringify(next));
      return next;
    });
  }
  function clear() {
    setPoints([]);
    onChange("[]");
  }
  function locate() {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
          {label} <span className="text-slate-400 normal-case font-normal">· click map to add boundary points ({points.length})</span>
        </span>
        <div className="flex gap-1.5">
          <button type="button" onClick={locate} className="text-xs font-semibold text-emerald-700 hover:underline">📍 Locate</button>
          <button type="button" onClick={undo} disabled={!points.length} className="text-xs font-semibold text-slate-600 hover:underline disabled:opacity-40">Undo</button>
          <button type="button" onClick={clear} disabled={!points.length} className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-40">Clear</button>
        </div>
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
      {points.length > 0 && points.length < 3 && (
        <p className="text-xs text-amber-600">Add at least 3 points to form a coverage polygon.</p>
      )}
    </div>
  );
}
