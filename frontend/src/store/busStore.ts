import { create, type StateCreator } from "zustand";
import type { Feature, LineString } from "geojson";

export type BusStatus = "unknown" | "moving" | "stopped";
export type DriverStatus = "online" | "offline" | "idle";

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
  // Basic bus data
  busId: string | null;
  busNumber: string | null;
  
  // Route and location data
  routeGeoJson: Feature<LineString> | null;
  stops: Stop[];
  busLocation: BusLocation | null;
  etaMinutes: number | null;
  status: BusStatus;
  nextStop: Stop | null;
  
  // Driver information
  driverId: string | null;
  driverStatus: DriverStatus;
  isSharing: boolean;
  connectedStudentCount: number;
  
  // Status tracking
  isOnline: boolean;
  routeUpdateTimestamp: number;
  lastLocationReceived: number;
  stopArrivalAlerts: Record<string, boolean>;
  
  // Location history (max 100 recent locations for tracking)
  locationHistory: BusLocation[];
  
  // Actions
  setBusMeta: (payload: { busId: string; busNumber?: string | null }) => void;
  setRoute: (route: Feature<LineString> | null, stops: Stop[]) => void;
  setBusLocation: (location: BusLocation | null) => void;
  setEta: (etaMinutes: number | null) => void;
  setStatus: (status: BusStatus) => void;
  setNextStop: (stop: Stop | null) => void;
  addLocationToHistory: (location: BusLocation) => void;
  clearOldLocations: (maxAge: number) => void;
  getLocationHistory: () => BusLocation[];
  setDriverInfo: (driverId: string | null) => void;
  updateDriverStatus: (status: DriverStatus) => void;
  setIsSharing: (isSharing: boolean) => void;
  updateConnectedStudents: (count: number) => void;
  setIsOnline: (isOnline: boolean) => void;
}

const storeCreator: StateCreator<BusState> = (set, get) => ({
  busId: null,
  busNumber: null,
  routeGeoJson: null,
  stops: [],
  busLocation: null,
  etaMinutes: null,
  status: "unknown",
  nextStop: null,
  driverId: null,
  driverStatus: "offline",
  isSharing: false,
  connectedStudentCount: 0,
  isOnline: false,
  routeUpdateTimestamp: 0,
  lastLocationReceived: 0,
  stopArrivalAlerts: {},
  locationHistory: [],
  setBusMeta: ({ busId, busNumber = null }: { busId: string; busNumber?: string | null }) =>
    set(() => ({ busId, busNumber })),
  setRoute: (route: Feature<LineString> | null, stops: Stop[]) =>
    set(() => ({
      routeGeoJson: route,
      stops,
      routeUpdateTimestamp: Date.now(),
    })),
  setBusLocation: (location: BusLocation | null) => set(() => ({ 
    busLocation: location,
    lastLocationReceived: Date.now(),
  })),
  setEta: (etaMinutes: number | null) => set(() => ({ etaMinutes })),
  setStatus: (status: BusStatus) => set(() => ({ status })),
  setNextStop: (stop: Stop | null) => set(() => ({ nextStop: stop })),
  addLocationToHistory: (location: BusLocation) => set((state) => ({
    locationHistory: [...state.locationHistory, location].slice(-100), // Keep last 100 locations
  })),
  clearOldLocations: (maxAge: number) => set((state) => {
    const now = Date.now();
    return {
      locationHistory: state.locationHistory.filter(
        (loc) => loc.timestamp ? (now - loc.timestamp) < maxAge : true
      ),
    };
  }),
  getLocationHistory: () => get().locationHistory,
  setDriverInfo: (driverId: string | null) => set(() => ({ driverId })),
  updateDriverStatus: (status: DriverStatus) => set(() => ({ driverStatus: status })),
  setIsSharing: (isSharing: boolean) => set(() => ({ isSharing })),
  updateConnectedStudents: (count: number) => set(() => ({ connectedStudentCount: count })),
  setIsOnline: (isOnline: boolean) => set(() => ({ isOnline })),
});

export const useBusStore = create<BusState>(storeCreator);
