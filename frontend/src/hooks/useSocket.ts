"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useBusStore, BusLocation, Stop } from "../store/busStore";

const SOCKET_EVENTS = {
  JOIN_BUS: "joinBus",
  JOINED_BUS: "joinedBus",
  SEND_LOCATION: "sendLocation",
  RECEIVE_LOCATION: "receiveLocation",
  ERROR: "error",
} as const;

export type SocketRole = "student" | "driver";

const API_BASE_URL: string =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((globalThis as any)?.process?.env?.NEXT_PUBLIC_API_BASE_URL as string | undefined) ||
  "http://localhost:5000";

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceInMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3;
  const ph1 = toRadians(lat1);
  const ph2 = toRadians(lat2);
  const dPh = toRadians(lat2 - lat1);
  const dL = toRadians(lng2 - lng1);

  const a =
    Math.sin(dPh / 2) * Math.sin(dPh / 2) +
    Math.cos(ph1) * Math.cos(ph2) *
      Math.sin(dL / 2) * Math.sin(dL / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const findNearestStop = (stops: Stop[], location: BusLocation | null): Stop | null => {
  if (!location || stops.length === 0) return null;
  let best: Stop | null = null;
  let bestDist = Infinity;

  for (const stop of stops) {
    const d = distanceInMeters(location.lat, location.lng, stop.lat, stop.lng);
    if (d < bestDist) {
      bestDist = d;
      best = stop;
    }
  }

  return best;
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
};

export const useSocket = (role: SocketRole, busId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const {
    stops,
    setBusLocation,
    setEta,
    setStatus,
    setNextStop,
  } = useBusStore();

  useEffect(() => {
    if (!busId) return;
    const token = getAuthToken();
    if (!token) return;

    const socket = io(API_BASE_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    if (role === "student") {
      socket.on("connect", () => {
        socket.emit(SOCKET_EVENTS.JOIN_BUS, { busId });
      });

      let lastLocation: BusLocation | null = null;

      socket.on(SOCKET_EVENTS.RECEIVE_LOCATION, (payload: any) => {
        const location: BusLocation = {
          busId: String(payload.busId),
          lat: payload.lat,
          lng: payload.lng,
          speed: payload.speed,
          heading: payload.heading,
          timestamp: payload.timestamp,
        };

        const now = typeof payload.timestamp === "number" ? payload.timestamp : Date.now();
        let etaMinutes: number | null = null;
        let status: "moving" | "stopped" | "unknown" = "unknown";

        if (lastLocation && lastLocation.timestamp) {
          const dtSeconds = (now - lastLocation.timestamp) / 1000;
          const dMeters = distanceInMeters(
            lastLocation.lat,
            lastLocation.lng,
            location.lat,
            location.lng
          );
          const speed = dtSeconds > 0 ? dMeters / dtSeconds : 0;

          if (speed > 0.5) {
            status = "moving";
            const next = findNearestStop(stops, location);
            if (next) {
              const distToNext = distanceInMeters(
                location.lat,
                location.lng,
                next.lat,
                next.lng
              );
              etaMinutes = distToNext / speed / 60;
              setNextStop(next);
            }
          } else {
            status = "stopped";
          }
        }

        setBusLocation(location);
        setEta(etaMinutes);
        setStatus(status);
        lastLocation = { ...location, timestamp: now };
      });
    }

    socket.on(SOCKET_EVENTS.ERROR, (err: unknown) => {
      console.error("Socket error", err);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [role, busId, stops, setBusLocation, setEta, setStatus, setNextStop]);

  const sendLocation = (payload: {
    busId: string;
    lat: number;
    lng: number;
    speed?: number;
    heading?: number;
  }) => {
    if (!socketRef.current) return;
    socketRef.current.emit(SOCKET_EVENTS.SEND_LOCATION, payload);
  };

  return { socket: socketRef.current, sendLocation };
};
