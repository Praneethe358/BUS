import { create, type StateCreator } from "zustand";
import type { Feature, LineString } from "geojson";

export type BusStatus = "unknown" | "moving" | "stopped";

export interface BusLocation {
  busId?: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp?: number;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order?: number;
}

export interface BusState {
  busId: string | null;
  busNumber: string | null;
  routeGeoJson: Feature<LineString> | null;
  stops: Stop[];
  busLocation: BusLocation | null;
  etaMinutes: number | null;
  status: BusStatus;
  nextStop: Stop | null;
  setBusMeta: (payload: { busId: string; busNumber?: string | null }) => void;
  setRoute: (route: Feature<LineString> | null, stops: Stop[]) => void;
  setBusLocation: (location: BusLocation | null) => void;
  setEta: (etaMinutes: number | null) => void;
  setStatus: (status: BusStatus) => void;
  setNextStop: (stop: Stop | null) => void;
}

const storeCreator: StateCreator<BusState> = (set) => ({
  busId: null,
  busNumber: null,
  routeGeoJson: null,
  stops: [],
  busLocation: null,
  etaMinutes: null,
  status: "unknown",
  nextStop: null,
  setBusMeta: ({ busId, busNumber = null }: { busId: string; busNumber?: string | null }) =>
    set(() => ({ busId, busNumber })),
  setRoute: (route: Feature<LineString> | null, stops: Stop[]) =>
    set(() => ({
      routeGeoJson: route,
      stops,
    })),
  setBusLocation: (location: BusLocation | null) => set(() => ({ busLocation: location })),
  setEta: (etaMinutes: number | null) => set(() => ({ etaMinutes })),
  setStatus: (status: BusStatus) => set(() => ({ status })),
  setNextStop: (stop: Stop | null) => set(() => ({ nextStop: stop })),
});

export const useBusStore = create<BusState>(storeCreator);
