"use client";

import { useEffect, useMemo, useRef } from "react";
import type { GeoJSONSource, Map, Marker } from "mapbox-gl";
import { useBusStore, type Stop } from "../../store/busStore";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const buildStopMarker = (stop: Stop) => {
  const el = document.createElement("div");
  el.className =
    "relative flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md";
  el.setAttribute("data-stop-id", stop.id);

  const dot = document.createElement("span");
  dot.className = "absolute h-2 w-2 rounded-full bg-sky-500";
  el.appendChild(dot);

  return el;
};

const buildBusMarker = () => {
  const el = document.createElement("div");
  el.className =
    "relative h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-[0_12px_28px_rgba(16,185,129,0.35)]";

  const pulse = document.createElement("span");
  pulse.className =
    "absolute inset-0 animate-ping rounded-full bg-emerald-300/40";
  el.appendChild(pulse);

  const core = document.createElement("span");
  core.className =
    "absolute inset-[4px] rounded-full border border-white/80 bg-white";
  el.appendChild(core);

  const arrow = document.createElement("span");
  arrow.className =
    "absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-sm bg-white shadow";
  arrow.style.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
  arrow.setAttribute("data-bus-arrow", "true");
  el.appendChild(arrow);

  return el;
};

export function BusMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const busMarkerRef = useRef<Marker | null>(null);
  const busMarkerArrowRef = useRef<HTMLSpanElement | null>(null);
  const stopsMarkersRef = useRef<Marker[]>([]);
  const animationRef = useRef<number | null>(null);
  const currentPositionRef = useRef<{ lng: number; lat: number } | null>(null);
  const targetPositionRef = useRef<{ lng: number; lat: number } | null>(null);
  const animationStartRef = useRef<number | null>(null);

  const { routeGeoJson, stops, busLocation, nextStop } = useBusStore();
  const hasToken = useMemo(() => Boolean(MAPBOX_TOKEN), []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !hasToken) {
      return;
    }

    let cancelled = false;

    const init = async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = MAPBOX_TOKEN || "";

      if (cancelled) {
        return;
      }

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [77.5946, 12.9716],
        zoom: 13,
        pitch: 45,
        bearing: -12,
        antialias: true,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        if (routeGeoJson) {
          map.addSource("route", {
            type: "geojson",
            data: routeGeoJson,
          });

          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
            paint: {
              "line-color": "#38bdf8",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });

          map.addLayer({
            id: "route-glow",
            type: "line",
            source: "route",
            paint: {
              "line-color": "#38bdf8",
              "line-width": 12,
              "line-opacity": 0.15,
            },
          });
        }

        if (stops.length > 0 && stopsMarkersRef.current.length === 0) {
          stopsMarkersRef.current = stops.map((stop: Stop) => {
            const marker = new mapboxgl.Marker(buildStopMarker(stop))
              .setLngLat([stop.lng, stop.lat])
              .addTo(map);
            return marker;
          });
        }
      });
    };

    void init();

    return () => {
      cancelled = true;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      stopsMarkersRef.current.forEach((marker) => marker.remove());
      stopsMarkersRef.current = [];
      busMarkerRef.current = null;
    };
  }, [hasToken, routeGeoJson, stops]);

  useEffect(() => {
    if (!mapRef.current || !busLocation) {
      return;
    }

    const map = mapRef.current;
    const mapboxglPromise = import("mapbox-gl");
    let disposed = false;

    const stopAnimation = () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    const animateTo = async () => {
      const { default: mapboxgl } = await mapboxglPromise;

      if (disposed || !mapRef.current) {
        return;
      }

      if (!busMarkerRef.current) {
        const markerElement = buildBusMarker();
        busMarkerArrowRef.current = markerElement.querySelector(
          "[data-bus-arrow]"
        ) as HTMLSpanElement | null;
        busMarkerRef.current = new mapboxgl.Marker(markerElement)
          .setLngLat([busLocation.lng, busLocation.lat])
          .addTo(map);
        currentPositionRef.current = { lng: busLocation.lng, lat: busLocation.lat };
        targetPositionRef.current = { lng: busLocation.lng, lat: busLocation.lat };
        animationStartRef.current = null;
        return;
      }

      const start = currentPositionRef.current ?? {
        lng: busLocation.lng,
        lat: busLocation.lat,
      };
      const end = {
        lng: busLocation.lng,
        lat: busLocation.lat,
      };

      targetPositionRef.current = end;
      animationStartRef.current = performance.now();

      stopAnimation();

      const duration = Math.max(700, Math.min(1600, 1200));
      const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

      const tick = (now: number) => {
        if (disposed || !busMarkerRef.current || !animationStartRef.current || !targetPositionRef.current) {
          return;
        }

        const progress = Math.min(1, (now - animationStartRef.current) / duration);
        const eased = easeOutCubic(progress);
        const target = targetPositionRef.current;
        const lng = start.lng + (target.lng - start.lng) * eased;
        const lat = start.lat + (target.lat - start.lat) * eased;

        busMarkerRef.current.setLngLat([lng, lat]);
        if (busMarkerArrowRef.current && typeof busLocation.heading === "number") {
          busMarkerArrowRef.current.style.transform = `rotate(${busLocation.heading}deg)`;
        }
        currentPositionRef.current = { lng, lat };

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(tick);
          return;
        }

        currentPositionRef.current = target;
        animationStartRef.current = null;
        animationRef.current = null;

        map.easeTo({
          center: [target.lng, target.lat],
          duration: 500,
          essential: true,
          zoom: Math.max(map.getZoom(), 14),
        });
      };

      animationRef.current = requestAnimationFrame(tick);
    };

    void animateTo();

    return () => {
      disposed = true;
      stopAnimation();
    };
  }, [busLocation]);

  useEffect(() => {
    if (!mapRef.current || !routeGeoJson) {
      return;
    }

    const map = mapRef.current;
    const source = map.getSource("route") as GeoJSONSource | undefined;
    if (source) {
      source.setData(routeGeoJson);
      return;
    }

    if (!map.isStyleLoaded()) {
      return;
    }

    map.addSource("route", {
      type: "geojson",
      data: routeGeoJson,
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#38bdf8",
        "line-width": 5,
        "line-opacity": 0.9,
      },
    });

    map.addLayer({
      id: "route-glow",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#38bdf8",
        "line-width": 12,
        "line-opacity": 0.15,
      },
    });
  }, [routeGeoJson]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    stopsMarkersRef.current.forEach((marker) => marker.remove());
    stopsMarkersRef.current = [];

    if (stops.length === 0) {
      return;
    }

    const map = mapRef.current;
    const mapboxglPromise = import("mapbox-gl");
    mapboxglPromise.then(({ default: mapboxgl }) => {
      stopsMarkersRef.current = stops.map((stop: Stop) => {
        const marker = new mapboxgl.Marker(buildStopMarker(stop))
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);
        return marker;
      });
    });
  }, [stops]);

  useEffect(() => {
    if (!nextStop) {
      return;
    }

    stopsMarkersRef.current.forEach((marker) => {
      const el = marker.getElement();
      const isNext = el.getAttribute("data-stop-id") === nextStop.id;
      el.classList.toggle("ring-2", isNext);
      el.classList.toggle("ring-emerald-400", isNext);
      el.classList.toggle("scale-110", isNext);
    });
  }, [nextStop]);

  if (!hasToken) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-red-500">
        Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.
      </div>
    );
  }

  return <div ref={mapContainerRef} className="h-full w-full rounded-3xl" />;
}
