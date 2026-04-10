"use client";

import { useEffect, useRef } from "react";
import type { DivIcon, LatLngTuple, Map as LeafletMap, Marker, Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useBusStore, type Stop } from "../../store/busStore";
import { useState } from "react";

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
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);
  const busMarkerRef = useRef<Marker | null>(null);
  const busMarkerArrowRef = useRef<HTMLSpanElement | null>(null);
  const stopsMarkersRef = useRef<Marker[]>([]);
  const routeLineRef = useRef<Polyline | null>(null);
  const routeGlowRef = useRef<Polyline | null>(null);
  const animationRef = useRef<number | null>(null);
  const currentPositionRef = useRef<{ lng: number; lat: number } | null>(null);
  const targetPositionRef = useRef<{ lng: number; lat: number } | null>(null);
  const animationStartRef = useRef<number | null>(null);

  const { routeGeoJson, stops, busLocation, nextStop } = useBusStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;

    const init = async () => {
      const L = await import("leaflet");

      if (cancelled) {
        return;
      }

      const map = L.map(mapContainerRef.current!, {
        zoomControl: true,
      }).setView([12.9716, 77.5946], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true);
      // Leaflet can initialize before container layout settles; invalidate to prevent blank/offset tiles.
      setTimeout(() => {
        map.invalidateSize();
      }, 0);
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
      setMapReady(false);
      stopsMarkersRef.current.forEach((marker) => marker.remove());
      stopsMarkersRef.current = [];
      routeLineRef.current = null;
      routeGlowRef.current = null;
      busMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !busLocation) {
      return;
    }

    const map = mapRef.current;
    const leafletPromise = import("leaflet");
    let disposed = false;

    const stopAnimation = () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    const animateTo = async () => {
      const L = await leafletPromise;

      if (disposed || !mapRef.current) {
        return;
      }

      if (!busMarkerRef.current) {
        const markerElement = buildBusMarker();
        busMarkerArrowRef.current = markerElement.querySelector(
          "[data-bus-arrow]"
        ) as HTMLSpanElement | null;
        const icon: DivIcon = L.divIcon({
          className: "leaflet-bus-marker",
          html: markerElement,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        busMarkerRef.current = L.marker([busLocation.lat, busLocation.lng], {
          icon,
          interactive: false,
        })
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

        busMarkerRef.current.setLatLng([lat, lng]);
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

        map.panTo([target.lat, target.lng], {
          animate: true,
          duration: 0.5,
        });
        if (map.getZoom() < 14) {
          map.setZoom(14, { animate: true });
        }
      };

      animationRef.current = requestAnimationFrame(tick);
    };

    void animateTo();

    return () => {
      disposed = true;
      stopAnimation();
    };
  }, [busLocation, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !routeGeoJson) {
      return;
    }

    const map = mapRef.current;
    const points = routeGeoJson.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as LatLngTuple
    );

    if (routeGlowRef.current) {
      routeGlowRef.current.setLatLngs(points);
    }
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(points);
    }

    if (!routeGlowRef.current || !routeLineRef.current) {
      import("leaflet").then((L) => {
        if (!mapRef.current) {
          return;
        }

        routeGlowRef.current?.remove();
        routeLineRef.current?.remove();

        routeGlowRef.current = L.polyline(points, {
          color: "#38bdf8",
          weight: 12,
          opacity: 0.15,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        routeLineRef.current = L.polyline(points, {
          color: "#38bdf8",
          weight: 5,
          opacity: 0.9,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        const bounds = routeLineRef.current.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
        }
      });
    }
  }, [routeGeoJson, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    stopsMarkersRef.current.forEach((marker) => marker.remove());
    stopsMarkersRef.current = [];

    if (stops.length === 0) {
      return;
    }

    const map = mapRef.current;
    const leafletPromise = import("leaflet");
    leafletPromise.then((L) => {
      stopsMarkersRef.current = stops.map((stop: Stop) => {
        const icon: DivIcon = L.divIcon({
          className: "leaflet-stop-marker",
          html: buildStopMarker(stop),
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([stop.lat, stop.lng], {
          icon,
          interactive: false,
        }).addTo(map);

        return marker;
      });

      if (!routeGeoJson) {
        const allPoints = stops.map((stop) => [stop.lat, stop.lng] as LatLngTuple);
        const bounds = L.latLngBounds(allPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
        }
      }
    });
  }, [stops, routeGeoJson, mapReady]);

  useEffect(() => {
    if (!nextStop) {
      return;
    }

    stopsMarkersRef.current.forEach((marker) => {
      const el = marker.getElement();
      if (!el) {
        return;
      }
      const isNext = el.getAttribute("data-stop-id") === nextStop.id;
      el.classList.toggle("ring-2", isNext);
      el.classList.toggle("ring-emerald-400", isNext);
      el.classList.toggle("scale-110", isNext);
    });
  }, [nextStop]);

  return <div ref={mapContainerRef} className="h-full w-full rounded-3xl" />;
}
