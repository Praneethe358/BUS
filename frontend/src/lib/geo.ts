import type { BusLocation, Stop } from "../store/busStore";

const toRad = (value: number) => (value * Math.PI) / 180;

export const distanceInMeters = (a: BusLocation, b: BusLocation) => {
  const earth = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
};

export const findNextStop = (stops: Stop[], location: BusLocation | null) => {
  if (!location || stops.length === 0) {
    return null;
  }

  let bestStop: Stop | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const stop of stops) {
    const dist = distanceInMeters(location, {
      lat: stop.lat,
      lng: stop.lng,
    });

    if (dist < bestDistance) {
      bestDistance = dist;
      bestStop = stop;
    }
  }

  return bestStop;
};

export const formatEta = (etaMinutes: number | null) => {
  if (etaMinutes === null || Number.isNaN(etaMinutes)) {
    return "--";
  }

  if (etaMinutes < 1) {
    return "<1 min";
  }

  const rounded = Math.round(etaMinutes);
  return `${rounded} min`;
};

export const estimateEtaMinutes = (
  distanceMeters: number,
  speedMps?: number
) => {
  const safeSpeed = speedMps && speedMps > 0 ? speedMps : 8;
  return Math.max(1, distanceMeters / safeSpeed / 60);
};
