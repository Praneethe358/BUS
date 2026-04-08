"use client";

import { useEffect, useRef } from "react";
import { useBusStore, Stop } from "../../store/busStore";

const MAPBOX_TOKEN: string | undefined =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any)?.process?.env?.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string | undefined);

export function BusMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const busMarkerRef = useRef<any>(null);
  const routeAddedRef = useRef(false);
  const stopsMarkersRef = useRef<any[]>([]);

  const { routeGeoJson, stops, busLocation, nextStop } = useBusStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !MAPBOX_TOKEN) return;

    let isCancelled = false;

    const init = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      if (isCancelled) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [77.5946, 12.9716],
        zoom: 12,
        pitch: 45,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        if (routeGeoJson && !routeAddedRef.current) {
          map.addSource("route", {
            type: "geojson",
            data: routeGeoJson,
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#2563eb",
              "line-width": 4,
            },
          });
          routeAddedRef.current = true;
        }

        if (stops.length > 0 && stopsMarkersRef.current.length === 0) {
          stopsMarkersRef.current = stops.map((stop: Stop) => {
            const el = document.createElement("div");
            el.className =
              "rounded-full bg-white shadow-md border border-blue-500 w-4 h-4 -translate-x-1/2 -translate-y-1/2";
            return new mapboxgl.Marker(el).setLngLat([stop.lng, stop.lat]).addTo(map);
          });
        }
      });
    };

    void init();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      stopsMarkersRef.current.forEach((m) => m.remove());
      stopsMarkersRef.current = [];
      busMarkerRef.current = null;
      routeAddedRef.current = false;
    };
  }, [routeGeoJson, stops]);

  useEffect(() => {
    if (!mapRef.current || !busLocation) return;

    void (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;

      if (!busMarkerRef.current) {
        const el = document.createElement("div");
        el.className =
          "w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2";
        busMarkerRef.current = new mapboxgl.Marker(el).setLngLat([
          busLocation.lng,
          busLocation.lat,
        ]);
        busMarkerRef.current.addTo(mapRef.current);
      } else {
        busMarkerRef.current.setLngLat([busLocation.lng, busLocation.lat]);
      }

      mapRef.current.easeTo({
        center: [busLocation.lng, busLocation.lat],
        duration: 1000,
        zoom: Math.max(mapRef.current.getZoom(), 14),
      });
    })();
  }, [busLocation]);

  useEffect(() => {
    if (!mapRef.current || !nextStop) return;

    const existing = stopsMarkersRef.current;
    if (!existing.length) return;

    existing.forEach((marker) => {
      const el = marker.getElement();
      el.classList.remove("bg-blue-600", "w-5", "h-5");
      el.classList.add("bg-white", "w-4", "h-4");
    });

    const idx = stops.findIndex((s: Stop) => s.id === nextStop.id);
    if (idx >= 0) {
      const marker = existing[idx];
      const el = marker.getElement();
      el.classList.remove("bg-white", "w-4", "h-4");
      el.classList.add("bg-blue-600", "w-5", "h-5");
    }
  }, [nextStop, stops]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-red-600">
        Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.
      </div>
    );
  }

  return <div ref={mapContainerRef} className="h-full w-full rounded-3xl" />;
}
