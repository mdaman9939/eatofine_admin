"use client";

/* Minimal typings for the slice of Leaflet we use (loaded from CDN at runtime,
 * so there's no npm dependency / no bundle weight). Shared by MapPicker (a
 * draggable pin) and ZonePolygonPicker (draw-on-map polygon). */
export interface LatLng { lat: number; lng: number }
export interface LeafletMarker { setLatLng(ll: [number, number]): void; on(e: string, h: (ev: { target: { getLatLng(): LatLng } }) => void): void }
export interface LeafletMap {
  setView(center: [number, number], zoom: number): LeafletMap;
  on(event: string, handler: (e: { latlng: LatLng }) => void): void;
  removeLayer(layer: unknown): void;
  addLayer(layer: unknown): void;
  invalidateSize(): void;
  remove(): void;
}
export interface Leaflet {
  map(el: HTMLElement, opts?: Record<string, unknown>): LeafletMap;
  tileLayer(url: string, opts: Record<string, unknown>): { addTo(m: LeafletMap): void };
  marker(latlng: [number, number], opts?: Record<string, unknown>): LeafletMarker & { addTo(m: LeafletMap): LeafletMarker };
  polygon(latlngs: Array<[number, number]>, opts?: Record<string, unknown>): unknown;
  circleMarker(latlng: [number, number], opts?: Record<string, unknown>): unknown;
}
declare global {
  interface Window { L?: Leaflet }
}

const CDN_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const CDN_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

/** Load Leaflet from the CDN exactly once and resolve when window.L exists. */
export function loadLeaflet(): Promise<Leaflet> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("no window")); return; }
    if (window.L) return resolve(window.L);
    if (!document.querySelector(`link[href="${CDN_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CDN_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${CDN_JS}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => (window.L ? resolve(window.L) : reject(new Error("Leaflet failed"))));
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement("script");
    script.src = CDN_JS;
    script.async = true;
    script.onload = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet failed")));
    script.onerror = () => reject(new Error("Leaflet CDN unreachable"));
    document.head.appendChild(script);
  });
}
