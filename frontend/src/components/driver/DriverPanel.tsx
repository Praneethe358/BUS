"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDriverSocket } from "../../hooks/useDriverSocket";
import { useBusStore } from "../../store/busStore";

interface DriverPanelProps {
  busId: string;
  busNumber: string;
}

export function DriverPanel({ busId, busNumber }: DriverPanelProps) {
  const { sendLocation, status } = useDriverSocket();
  const { setBusMeta, setBusLocation } = useBusStore();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastEmitRef = useRef<number>(0);
  const statusLabel = useMemo(() => {
    if (status === "connected") return "Connected";
    if (status === "connecting") return "Connecting";
    if (status === "error") return "Error";
    return "Idle";
  }, [status]);

  useEffect(() => {
    setBusMeta({ busId, busNumber });
  }, [busId, busNumber, setBusMeta]);

  useEffect(() => {
    if (!sharing) {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastEmitRef.current < 3000) {
          return;
        }
        lastEmitRef.current = now;

        const { latitude, longitude, speed, heading } = pos.coords;
        const payload = {
          busId,
          lat: latitude,
          lng: longitude,
          speed: speed ?? undefined,
          heading: heading ?? undefined,
          timestamp: now,
        };

        setBusLocation(payload);
        sendLocation(payload);
      },
      (geoError) => {
        setError(geoError.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sharing, busId, sendLocation, setBusLocation]);

  return (
    <div className="space-y-4 rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Driver
          </p>
          <h2 className="text-lg font-semibold">Live Broadcast</h2>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
          {statusLabel}
        </span>
      </div>
      <p className="text-sm text-neutral-600">
        Toggle location sharing to start broadcasting your live position to
        students.
      </p>
      <button
        type="button"
        onClick={() => setSharing((prev) => !prev)}
        className={`w-full rounded-full px-4 py-3 text-sm font-medium text-white shadow-md transition-colors ${
          sharing ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {sharing ? "Stop Sharing" : "Start Sharing"}
      </button>
      <p className="text-xs text-neutral-500">
        Location updates are throttled to every 3-5 seconds for battery
        efficiency.
      </p>
      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
