import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = { id: string; name: string; lat: number; lng: number; label?: string };

/** Leaflet map loaded only in the browser. Click to pick a location when onPick is set. */
export function PlantMap({ points, onPick, picked, className = "h-72" }: { points: MapPoint[]; onPick?: (lat: number, lng: number) => void; picked?: { lat: number; lng: number } | null; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<import("leaflet").Map | null>(null);
  const layer = useRef<import("leaflet").LayerGroup | null>(null);
  const L = useRef<typeof import("leaflet") | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      if (cancelled || !el.current || map.current) return;
      const Lf = (mod.default ?? mod) as typeof import("leaflet");
      L.current = Lf;
      const m = Lf.map(el.current, { scrollWheelZoom: false }).setView([22.5, 79], 4);
      Lf.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(m);
      m.on("click", (e) => pickRef.current?.(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)));
      map.current = m;
      layer.current = Lf.layerGroup().addTo(m);
      draw();
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = () => {
    const Lf = L.current, g = layer.current, m = map.current;
    if (!Lf || !g || !m) return;
    g.clearLayers();
    const all = [...points, ...(picked ? [{ id: "picked", name: "New plant", lat: picked.lat, lng: picked.lng }] : [])];
    all.forEach((p) => {
      Lf.circleMarker([p.lat, p.lng], { radius: 9, color: "#123B2A", weight: 2, fillColor: p.id === "picked" ? "#F5C84C" : "#35A66F", fillOpacity: 0.9 })
        .bindPopup(`<strong>${p.name.replace(/</g, "&lt;")}</strong>${p.label ? `<br/>${p.label}` : ""}`)
        .addTo(g);
    });
    if (points.length === 1 && !picked) m.setView([points[0]!.lat, points[0]!.lng], 11);
    else if (points.length > 1) m.fitBounds(points.map((p) => [p.lat, p.lng] as [number, number]), { padding: [30, 30], maxZoom: 10 });
  };
  useEffect(draw, [JSON.stringify(points), picked?.lat, picked?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={el} className={`relative z-0 w-full overflow-hidden rounded-md border ${className}`} />;
}
