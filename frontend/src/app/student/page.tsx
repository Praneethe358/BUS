"use client";

import { useEffect } from "react";
import { BusMap } from "../../components/map/BusMap";
import { useSocket } from "../../hooks/useSocket";
import { useBusStore, Stop } from "../../store/busStore";

// Example static route & stops; in production you would load these
// from your backend's /bus API for the logged-in student.
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

export default function StudentPage() {
  const busId = "demo-bus-id"; // Replace with student's assigned busId

  const { busLocation, etaMinutes, status, nextStop, setBusMeta, setRoute } =
    useBusStore();

  useSocket("student", busId);

  useEffect(() => {
    setBusMeta({ busId, busNumber: "21A" });
    setRoute(demoRoute, demoStops);
  }, [busId, setBusMeta, setRoute]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between px-4 py-3 shadow-md shadow-slate-900/80">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/90 text-sm font-semibold text-slate-950">
            SB
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Student
            </p>
            <p className="text-sm font-medium">Live Bus Tracker</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:flex-row">
        <section className="relative h-[360px] flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl md:h-auto">
          <BusMap />

          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-between gap-3">
            <article className="pointer-events-auto flex-1 rounded-3xl bg-slate-950/90 p-4 shadow-xl backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Bus
                  </p>
                  <p className="text-base font-semibold">21A · Campus Loop</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {nextStop ? `Next · ${nextStop.name}` : "Waiting for location"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    ETA
                  </p>
                  <p className="text-lg font-semibold">
                    {etaMinutes ? `${Math.round(etaMinutes)} min` : "--"}
                  </p>
                  <p
                    className={`mt-1 text-[11px] ${
                      status === "moving"
                        ? "text-emerald-400"
                        : status === "stopped"
                        ? "text-amber-400"
                        : "text-slate-500"
                    }`}
                  >
                    {status === "moving"
                      ? "On the move"
                      : status === "stopped"
                      ? "Temporarily stopped"
                      : "Waiting for bus"}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <aside className="flex h-full min-h-[220px] w-full flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 text-sm shadow-2xl md:h-auto md:max-w-xs">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Route overview
          </h2>
          <div className="space-y-2">
            {demoStops.map((stop, index) => {
              const isNext = nextStop?.id === stop.id;
              return (
                <div
                  key={stop.id}
                  className={`flex items-center justify-between rounded-2xl px-3 py-2 text-xs ${
                    isNext
                      ? "bg-emerald-500/10 border border-emerald-500/60"
                      : "bg-slate-900/80 border border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isNext ? "bg-emerald-400" : "bg-slate-600"
                      }`}
                    />
                    <span>{stop.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Stop {index + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto rounded-2xl bg-slate-950/60 p-3 text-xs text-slate-400">
            <p>
              This view auto-follows your bus and highlights the upcoming stop
              based on the latest GPS updates.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
