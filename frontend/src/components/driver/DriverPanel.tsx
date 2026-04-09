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
  const [permissionState, setPermissionState] = useState<
    "prompt" | "granted" | "denied" | "unsupported"
  >("prompt");
  const [emitIntervalMs, setEmitIntervalMs] = useState(3000);
  const [highAccuracy, setHighAccuracy] = useState(true);
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
    if (typeof navigator === "undefined" || !("permissions" in navigator)) {
      setPermissionState("unsupported");
      return;
    }

    let mounted = true;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (!mounted) {
          return;
        }
        setPermissionState(result.state);
        result.onchange = () => setPermissionState(result.state);
      })
      .catch(() => {
        if (mounted) {
          setPermissionState("prompt");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const requestPermission = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => setPermissionState("granted"),
      (geoError) => setError(geoError.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

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

        if (now - lastEmitRef.current >= emitIntervalMs) {
          lastEmitRef.current = now;
          sendLocation(payload);
        }
      },
      (geoError) => {
        setError(geoError.message);
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: highAccuracy ? 1000 : 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [sharing, busId, emitIntervalMs, highAccuracy, sendLocation, setBusLocation]);

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
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-[0.18em] text-[11px] text-slate-400">
            Location Permission
          </span>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
              permissionState === "granted"
                ? "bg-emerald-100 text-emerald-700"
                : permissionState === "denied"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {permissionState}
          </span>
        </div>
        {permissionState !== "granted" ? (
          <button
            type="button"
            onClick={requestPermission}
            className="mt-2 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Request permission
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setSharing((prev) => !prev)}
        className={`w-full rounded-full px-4 py-3 text-sm font-medium text-white shadow-md transition-colors ${
          sharing ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
        }`}
      >
        {sharing ? "Stop Sharing" : "Start Sharing"}
      </button>
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
        <button
          type="button"
          onClick={() => {
            setHighAccuracy(true);
            setEmitIntervalMs(3000);
          }}
          className={`rounded-xl border px-3 py-2 transition ${
            highAccuracy
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white"
          }`}
        >
          High accuracy
        </button>
        <button
          type="button"
          onClick={() => {
            setHighAccuracy(false);
            setEmitIntervalMs(5000);
          }}
          className={`rounded-xl border px-3 py-2 transition ${
            !highAccuracy
              ? "border-slate-300 bg-slate-100 text-slate-700"
              : "border-slate-200 bg-white"
          }`}
        >
          Battery saver
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        Location updates are sent every {Math.round(emitIntervalMs / 1000)}s.
      </p>
      {error ? (
        <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
