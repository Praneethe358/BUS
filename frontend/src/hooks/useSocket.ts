"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

type UseSocketOptions = {
  url?: string;
  token?: string;
  autoConnect?: boolean;
};

type UseSocketResult = {
  socket: Socket | null;
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
};

const DEFAULT_SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export const useSocket = ({
  url,
  token,
  autoConnect = true,
}: UseSocketOptions): UseSocketResult => {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const resolvedUrl = useMemo(() => url || DEFAULT_SOCKET_URL, [url]);

  const connect = useCallback(() => {
    if (!resolvedUrl) {
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(resolvedUrl, {
        autoConnect: false,
        transports: ["websocket"],
        auth: token ? { token } : undefined,
      });
    }

    setStatus("connecting");
    socketRef.current.connect();
  }, [resolvedUrl, token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setStatus("idle");
  }, []);

  useEffect(() => {
    if (!socketRef.current) {
      return;
    }

    const socket = socketRef.current;
    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("idle");
    const onError = () => setStatus("error");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, [socketRef]);

  useEffect(() => {
    if (!autoConnect) {
      return;
    }

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect, connect]);

  return { socket: socketRef.current, status, connect, disconnect };
};
