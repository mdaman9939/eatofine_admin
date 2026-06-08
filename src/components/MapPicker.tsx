"use client";

import { useEffect, useRef, useState } from "react";
import { loadLeaflet, type LeafletMap, type LeafletMarker } from "../lib/leaflet";

/**
 * Location picker with a REAL draggable Leaflet pin (OpenStreetMap tiles — no
 * paid Google Maps API). Click the map or drag the marker to set the spot; the
 * lat/long inputs stay in sync. Stores the value as a `"lat,lng"` string.
 */
export function MapPicker({
  value,
  onChange,
  label = "Location",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [lat, lng] = parseLatLng(value);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  function setLat(v: string) { onChange(`${v},${lng ?? ""}`); }
  function setLng(v: string) { onChange(`${lat ?? ""},${v}`); }

  // Init map once.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current) return;
        const start: [number, number] = lat !== null && lng !== null ? [lat, lng] : [20.5937, 78.9629];
        const map = L.map(containerRef.current).setView(start, lat !== null ? 15 : 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
        const marker = L.marker(start, { draggable: true }).addTo(map);
        marker.on("dragend", (e) => {
          const ll = e.target.getLatLng();
          onChangeRef.current(`${ll.lat.toFixed(6)},${ll.lng.toFixed(6)}`);
        });
        map.on("click", (e) => {
          marker.setLatLng([e.latlng.lat, e.latlng.lng]);
          onChangeRef.current(`${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`);
        });
        mapRef.current = map;
        markerRef.current = marker;
        setStatus("ready");
        setTimeout(() => map.invalidateSize(), 100);
      })
      .catch(() => setStatus("error"));
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync when lat/long typed manually.
  useEffect(() => {
    if (mapRef.current && markerRef.current && lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng)) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], 15);
    }
  }, [lat, lng]);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{label} <span className="text-slate-400 normal-case font-normal">· drag the pin or click the map</span></span>
        <button type="button" onClick={locate} className="cursor-pointer text-xs font-semibold text-emerald-700 hover:underline">📍 Use my location</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input type="text" inputMode="decimal" value={lat ?? ""} placeholder="Latitude" onChange={(e) => setLat(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
        <input type="text" inputMode="decimal" value={lng ?? ""} placeholder="Longitude" onChange={(e) => setLng(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15" />
      </div>

      <div className="rounded-lg overflow-hidden border border-slate-200 relative">
        <div ref={containerRef} className="w-full h-56 bg-slate-100" />
        {status === "loading" && <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none">Loading map…</div>}
        {status === "error" && <div className="absolute inset-0 flex items-center justify-center text-sm text-rose-500 bg-white/80 p-4 text-center">Map could not load — you can still type the coordinates.</div>}
      </div>
    </div>
  );
}

/** Parse a `"lat,lng"` string into numbers (or nulls when blank/invalid). */
function parseLatLng(value: string | undefined): [number | null, number | null] {
  if (!value) return [null, null];
  const [a, b] = value.split(",");
  const lat = a !== undefined && a.trim() !== "" ? Number(a) : null;
  const lng = b !== undefined && b.trim() !== "" ? Number(b) : null;
  return [lat, lng];
}
