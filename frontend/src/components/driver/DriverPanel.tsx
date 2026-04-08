"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useBusStore } from "../../store/busStore";

interface DriverPanelProps {
  busId: string;
}

export function DriverPanel({ busId }: DriverPanelProps) {
  const { sendLocation } = useSocket("driver", busId);
  const { setBusMeta, setBusLocation } = useBusStore();
  const [sharing, setSharing] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    setBusMeta({ busId });
  }, [busId, setBusMeta]);

  useEffect(() => {
    if (!sharing) {
      if (watchIdRef.current !== null && typeof navigator !== "undefined") {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!("geolocation" in navigator)) {
      console.error("Geolocation not available");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;

        const payload = {
          busId,
          lat: latitude,
          lng: longitude,
          speed: speed ?? undefined,
          heading: heading ?? undefined,
        };

        setBusLocation({ ...payload });
        sendLocation(payload);
      },
      (error) => {
        console.error("Geolocation error", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
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
      <h2 className="text-lg font-semibold">Driver Controls</h2>
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
        Location updates are sent every time the browser reports a new
        position.
      </p>
    </div>
  );
}
