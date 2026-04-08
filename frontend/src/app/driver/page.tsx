"use client";

import { useEffect } from "react";
import { BusMap } from "../../components/map/BusMap";
import { DriverPanel } from "../../components/driver/DriverPanel";
import { useBusStore, Stop } from "../../store/busStore";

const demoStops: Stop[] = [
  { id: "1", name: "Hostel", lat: 12.935, lng: 77.605 },
  { id: "2", name: "Library", lat: 12.938, lng: 77.61 },
  { id: "3", name: "Main Gate", lat: 12.94, lng: 77.615 },
];

const demoRoute: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: demoStops.map((s) => [s.lng, s.lat]),
      },
    },
  ],
};

export default function DriverPage() {
  const busId = "demo-bus-id"; // Replace with actual busId for this driver
  const { setBusMeta, setRoute } = useBusStore();

  useEffect(() => {
    setBusMeta({ busId, busNumber: "21A" });
    setRoute(demoRoute, demoStops);
  }, [busId, setBusMeta, setRoute]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between px-4 py-3 shadow-md shadow-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/90 text-sm font-semibold text-slate-950">
            SB
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Driver
            </p>
            <p className="text-sm font-medium">Share Live Location</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
        <section className="relative h-[360px] flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl md:h-auto">
          <BusMap />
        </section>

        <aside className="flex h-full min-h-[220px] w-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-sm shadow-2xl md:h-auto md:max-w-xs">
          <DriverPanel busId={busId} />
          <div className="rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-400">
            <p>
              Keep this tab open while driving. Your location will be shared
              with students assigned to this bus via Socket.IO.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
