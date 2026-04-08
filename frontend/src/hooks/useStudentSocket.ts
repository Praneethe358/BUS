"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Socket } from "socket.io-client";
import { useSocket } from "./useSocket";
import { SOCKET_EVENTS } from "../lib/socketEvents";
import { useBusStore } from "../store/busStore";
import {
  distanceInMeters,
  estimateEtaMinutes,
  findNextStop,
} from "../lib/geo";

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("token");
};

type UseStudentSocketOptions = {
  busId: string | null;
};

export const useStudentSocket = ({ busId }: UseStudentSocketOptions) => {
  const token = useMemo(() => getAuthToken(), []);
  const { socket, status } = useSocket({
    token: token ?? undefined,
    autoConnect: Boolean(token),
  });
  const { stops, setBusLocation, setEta, setStatus, setNextStop } = useBusStore();
  const lastLocationRef = useRef<{
    lat: number;
    lng: number;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    if (!socket || !busId) {
      return;
    }

    const typedSocket = socket as Socket;

    const onConnect = () => {
      typedSocket.emit(SOCKET_EVENTS.JOIN_BUS, { busId });
    };

    const onReceive = (payload: {
      busId: string;
      lat: number;
      lng: number;
      speed?: number;
      heading?: number;
      timestamp?: number;
    }) => {
      const timestamp =
        typeof payload.timestamp === "number" ? payload.timestamp : Date.now();
      const location = {
        busId: payload.busId,
        lat: payload.lat,
        lng: payload.lng,
        speed: payload.speed,
        heading: payload.heading,
        timestamp,
      };

      const lastLocation = lastLocationRef.current;
      let status: "unknown" | "moving" | "stopped" = "unknown";
      let etaMinutes: number | null = null;

      if (lastLocation) {
        const dist = distanceInMeters(lastLocation, location);
        const dtSeconds = (timestamp - lastLocation.timestamp) / 1000;
        const speedMps = dtSeconds > 0 ? dist / dtSeconds : undefined;

        if (speedMps && speedMps > 0.5) {
          status = "moving";
          const next = findNextStop(stops, location);
          if (next) {
            const distToNext = distanceInMeters(location, {
              lat: next.lat,
              lng: next.lng,
            });
            etaMinutes = estimateEtaMinutes(distToNext, speedMps);
            setNextStop(next);
          }
        } else {
          status = "stopped";
        }
      }

      setBusLocation(location);
      setStatus(status);
      setEta(etaMinutes);
      lastLocationRef.current = {
        lat: location.lat,
        lng: location.lng,
        timestamp,
      };
    };

    typedSocket.on("connect", onConnect);
    typedSocket.on(SOCKET_EVENTS.RECEIVE_LOCATION, onReceive);

    return () => {
      typedSocket.off("connect", onConnect);
      typedSocket.off(SOCKET_EVENTS.RECEIVE_LOCATION, onReceive);
    };
  }, [busId, socket, setBusLocation, setEta, setStatus, setNextStop, stops]);

  return { socket, status };
};
