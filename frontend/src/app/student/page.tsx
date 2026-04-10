"use client";

import { useEffect, useMemo } from "react";
import { BusMap } from "../../components/map/BusMap";
import { useStudentSocket } from "../../hooks/useStudentSocket";
import { useBusStore, type Stop } from "../../store/busStore";
import { formatEta } from "../../lib/geo";
import { sampleRoute, sampleStops } from "../../data/sampleRoute";

export default function StudentPage() {
  const busId = "demo-bus-id";

  const { busNumber, etaMinutes, status, nextStop, busLocation, setBusMeta, setRoute, stops } =
    useBusStore();

  useStudentSocket({ busId });

  const isArriving = useMemo(() => {
    return Boolean(etaMinutes !== null && etaMinutes <= 3 && status !== "stopped");
  }, [etaMinutes, status]);

  const routeLabel = useMemo(() => {
    return sampleRoute.properties?.name || "Campus Loop";
  }, []);

  useEffect(() => {
    setBusMeta({ busId, busNumber: "21A" });
    setRoute(sampleRoute, sampleStops);
  }, [busId, setBusMeta, setRoute]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_32%),linear-gradient(180deg,#020617_0%,#020617_35%,#0f172a_100%)] text-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 pb-3 pt-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20">
            SB
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Student Tracker
            </p>
            <p className="text-lg font-semibold tracking-tight">Live Bus Journey</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 backdrop-blur md:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.14)]" />
          Auto-follow enabled
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pb-6 pt-2 sm:px-6 lg:px-8 lg:pb-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 shadow-[0_24px_90px_rgba(2,6,23,0.45)] ring-1 ring-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-400/10" />
          <div className="relative z-0 h-[74vh] min-h-[560px] w-full lg:h-[78vh]">
            <BusMap />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1200] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4 lg:px-6 lg:pb-6">
              <article className="pointer-events-auto w-full max-w-3xl rounded-[1.75rem] border border-white/15 bg-slate-950/96 p-4 shadow-[0_18px_70px_rgba(2,6,23,0.7)] backdrop-blur-xl transition duration-300 ease-out animate-[floatUp_400ms_ease-out] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/6 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-slate-300 uppercase">
                        Bus {busNumber || "21A"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase transition-all duration-300 ${
                          isArriving
                            ? "bg-amber-400/15 text-amber-300 shadow-[0_0_0_1px_rgba(251,191,36,0.18)]"
                            : status === "moving"
                            ? "bg-emerald-400/15 text-emerald-300"
                            : status === "stopped"
                            ? "bg-slate-500/15 text-slate-300"
                            : "bg-sky-400/15 text-sky-300"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isArriving ? "bg-amber-300 animate-pulse" : "bg-current"
                          }`}
                        />
                        {isArriving ? "Bus arriving" : status === "moving" ? "In transit" : status === "stopped" ? "Stopped" : "Waiting"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-400">{routeLabel}</p>
                      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                        Next stop: {nextStop?.name || "Waiting for location"}
                      </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          ETA
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-white transition-all duration-300">
                          {formatEta(etaMinutes)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          Status
                        </p>
                        <p className="mt-1 text-lg font-semibold capitalize text-white transition-all duration-300">
                          {status}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 sm:col-span-1 col-span-2 sm:col-auto">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          Arrival
                        </p>
                        <p className="mt-1 text-lg font-semibold text-amber-300 transition-all duration-300">
                          {isArriving ? "Very close" : "On schedule"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end sm:text-right">
                    <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Live signal
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="relative flex h-3 w-3 items-center justify-center">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-70" />
                          <span className="relative h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.12)]" />
                        </span>
                        <span className="text-sm font-medium text-emerald-100">
                          Tracking active
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        Next stop
                      </p>
                      <p className="mt-1 max-w-[14rem] text-sm font-semibold text-white">
                        {nextStop?.name || "Waiting for bus"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-white/8 bg-white/4 p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      Route stops
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {nextStop ? `Approaching ${nextStop.name}` : "Route synced"}
                    </p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {stops.map((stop: Stop, index: number) => {
                      const isNext = nextStop?.id === stop.id;
                      return (
                        <div
                          key={stop.id}
                          className={`min-w-[150px] rounded-2xl border px-3 py-3 transition-all duration-300 ${
                            isNext
                              ? "border-amber-400/40 bg-amber-400/10 shadow-[0_12px_40px_rgba(251,191,36,0.12)]"
                              : "border-white/8 bg-slate-950/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                                  isNext ? "bg-amber-300 shadow-[0_0_0_6px_rgba(251,191,36,0.12)]" : "bg-slate-600"
                                }`}
                              />
                              <p className="text-sm font-medium text-white">{stop.name}</p>
                            </div>
                            <span className="text-[11px] text-slate-500">{index + 1}</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isNext ? "w-full bg-gradient-to-r from-amber-300 to-orange-400" : "w-1/3 bg-slate-600"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-[0_18px_60px_rgba(2,6,23,0.45)] sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Bus</p>
            <p className="mt-2 text-xl font-semibold text-white">{busNumber || "21A"}</p>
            <p className="mt-1 text-sm text-slate-400">{routeLabel}</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Current position</p>
            <p className="mt-2 text-sm font-medium text-white">
              {busLocation
                ? `${busLocation.lat.toFixed(5)}, ${busLocation.lng.toFixed(5)}`
                : "Waiting for first update"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {busLocation?.timestamp
                ? `Updated ${new Date(busLocation.timestamp).toLocaleTimeString()}`
                : "No timestamp yet"}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Motion</p>
            <p className="mt-2 text-sm font-medium capitalize text-white">{status}</p>
            <p className="mt-1 text-xs text-slate-400">
              {typeof busLocation?.speed === "number"
                ? `Speed: ${busLocation.speed.toFixed(1)} m/s`
                : "Speed unavailable"}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Next stop</p>
            <p className="mt-2 text-sm font-medium text-white">{nextStop?.name || "Waiting for bus"}</p>
            <p className="mt-1 text-xs text-slate-400">ETA: {formatEta(etaMinutes)}</p>
          </article>
        </section>
      </main>
    </div>
  );
}
