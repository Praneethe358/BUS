'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl, { Map, Marker, LngLatLike } from 'mapbox-gl';
import { io, Socket } from 'socket.io-client';

type BusLocation = {
  busId: string;
  lat: number;
  lng: number;
  timestamp?: number;
};

type BusTrackerMapProps = {
  busId: string;
  socketUrl: string;
  mapboxToken: string;
  socketToken?: string;
  initialCenter?: [number, number];
  zoom?: number;
  className?: string;
};

export default function BusTrackerMap({
  busId,
  socketUrl,
  mapboxToken,
  socketToken,
  initialCenter = [0, 0],
  zoom = 14,
  className,
}: BusTrackerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationStartRef = useRef<number | null>(null);
  const animationFromRef = useRef<[number, number] | null>(null);
  const animationToRef = useRef<[number, number] | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [latestLocation, setLatestLocation] = useState<BusLocation | null>(null);

  const stopMarkerAnimation = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    animationStartRef.current = null;
    animationFromRef.current = null;
    animationToRef.current = null;
  };

  const animateMarkerTo = (nextCenter: [number, number], duration = 900) => {
    const marker = markerRef.current;
    if (!marker) {
      return;
    }

    const currentPosition = marker.getLngLat();
    const start: [number, number] = animationToRef.current ?? [currentPosition.lng, currentPosition.lat];

    stopMarkerAnimation();

    animationFromRef.current = start;
    animationToRef.current = nextCenter;

    const tick = (timestamp: number) => {
      if (animationStartRef.current === null) {
        animationStartRef.current = timestamp;
      }

      const elapsed = timestamp - animationStartRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const from = animationFromRef.current ?? start;
      const to = animationToRef.current ?? nextCenter;
      const lng = from[0] + (to[0] - from[0]) * eased;
      const lat = from[1] + (to[1] - from[1]) * eased;

      marker.setLngLat([lng, lat] as LngLatLike);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const map = mapRef.current;
      if (map) {
        map.easeTo({
          center: nextCenter as LngLatLike,
          duration: 600,
          essential: true,
          zoom: Math.max(map.getZoom(), zoom),
        });
      }

      animationFrameRef.current = null;
      animationStartRef.current = null;
      animationFromRef.current = null;
      animationToRef.current = null;
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!busId || !socketUrl || !mapboxToken || !mapContainerRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter as LngLatLike,
      zoom,
    });

    mapRef.current = map;
    markerRef.current = new mapboxgl.Marker({ color: '#0f766e' })
      .setLngLat(initialCenter as LngLatLike)
      .addTo(map);

    const socket = io(socketUrl, {
      auth: socketToken ? { token: socketToken } : undefined,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;
    setStatus('connecting');

    const joinRoom = () => {
      socket.emit('joinBus', { busId });
    };

    socket.on('connect', () => {
      setStatus('connected');
      joinRoom();
    });

    socket.on('reconnect', () => {
      setStatus('connected');
      joinRoom();
    });

    socket.on('connect_error', () => {
      setStatus('error');
    });

    socket.on('receiveLocation', (payload: unknown) => {
      if (!payload || typeof payload !== 'object' || payload === null) {
        return;
      }

      const location = payload as BusLocation;
      if (location.busId !== busId) {
        return;
      }

      const nextCenter: [number, number] = [location.lng, location.lat];
      animateMarkerTo(nextCenter);
      setLatestLocation(location);
    });

    return () => {
      stopMarkerAnimation();
      socket.off('connect');
      socket.off('reconnect');
      socket.off('connect_error');
      socket.off('receiveLocation');
      socket.disconnect();
      socketRef.current = null;

      markerRef.current?.remove();
      markerRef.current = null;

      map.remove();
      mapRef.current = null;
    };
  }, [busId, socketUrl, socketToken, mapboxToken, initialCenter, zoom]);

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden' }} />

      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          zIndex: 1,
          padding: '10px 14px',
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#fff',
          fontSize: 14,
          lineHeight: 1.4,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div>Bus: {busId}</div>
        <div>Status: {status}</div>
        {latestLocation ? (
          <div>
            Lat: {latestLocation.lat.toFixed(6)} | Lng: {latestLocation.lng.toFixed(6)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
