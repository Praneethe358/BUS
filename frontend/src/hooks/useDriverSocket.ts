"use client";

import { useCallback, useMemo } from "react";
import { useSocket } from "./useSocket";
import { SOCKET_EVENTS } from "../lib/socketEvents";

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("token");
};

type DriverPayload = {
  busId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
};

export const useDriverSocket = () => {
  const token = useMemo(() => getAuthToken(), []);
  const { socket, status } = useSocket({
    token: token ?? undefined,
    autoConnect: Boolean(token),
  });

  const sendLocation = useCallback(
    (payload: DriverPayload) => {
      if (!socket) {
        return;
      }

      socket.emit(SOCKET_EVENTS.SEND_LOCATION, payload);
    },
    [socket]
  );

  return { socket, status, sendLocation };
};
