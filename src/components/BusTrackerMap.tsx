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
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [latestLocation, setLatestLocation] = useState<BusLocation | null>(null);

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

    socket.on('receiveLocation', (payload: BusLocation) => {
      if (!payload || payload.busId !== busId) {
        return;
      }

      const nextCenter: [number, number] = [payload.lng, payload.lat];
      markerRef.current?.setLngLat(nextCenter as LngLatLike);
      mapRef.current?.flyTo({ center: nextCenter as LngLatLike, zoom: Math.max(mapRef.current.getZoom(), zoom) });
      setLatestLocation(payload);
    });

    return () => {
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
