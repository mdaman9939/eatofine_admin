"use client";

import { useState } from "react";

/**
 * Dependency-free location picker. Stores the value as a `"lat,lng"` string.
 * Shows a live OpenStreetMap preview with a marker, lets the admin type exact
 * coordinates, drop a pin via "Use my location", and open the full OSM map to
 * pick a spot. (A draggable Leaflet pin would need an extra map library; this
 * gives the same lat/long capture with zero new dependencies.)
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
  const [busy, setBusy] = useState(false);
  const [lat, lng] = parseLatLng(value);

  function setLat(v: string) {
    onChange(`${v},${lng ?? ""}`);
  }
  function setLng(v: string) {
    onChange(`${lat ?? ""},${v}`);
  }

  function locate() {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`);
        setBusy(false);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  const hasPoint = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
  // Small bounding box around the point for the embed.
  const d = 0.01;
  const bbox = hasPoint ? `${lng! - d},${lat! - d},${lng! + d},${lat! + d}` : "-0.1,-0.1,0.1,0.1";
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${hasPoint ? `&marker=${lat},${lng}` : ""}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase">{label}</span>
        <button
          type="button"
          onClick={locate}
          disabled={busy}
          className="cursor-pointer text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
        >
          {busy ? "Locating…" : "📍 Use my location"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={lat ?? ""}
          placeholder="Latitude"
          onChange={(e) => setLat(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
        />
        <input
          type="text"
          inputMode="decimal"
          value={lng ?? ""}
          placeholder="Longitude"
          onChange={(e) => setLng(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
        />
      </div>

      <div className="rounded-lg overflow-hidden border border-slate-200">
        <iframe
          title="map"
          src={embed}
          className="w-full h-56"
          loading="lazy"
        />
      </div>
      <a
        href={hasPoint ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` : "https://www.openstreetmap.org"}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-emerald-700 hover:underline"
      >
        Open full map to find exact coordinates ↗
      </a>
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
