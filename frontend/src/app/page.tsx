"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="flex items-center justify-between px-6 py-4 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/90 text-sm font-semibold">
            SB
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">
              Smart Bus Tracking
            </p>
            <p className="text-xs text-slate-400">Live campus commute, reimagined.</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="grid w-full max-w-5xl gap-8 md:grid-cols-[3fr,2fr]">
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Track your campus bus in
              <span className="bg-gradient-to-r from-emerald-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                {" "}
                real time
              </span>
              .
            </h1>
            <p className="max-w-xl text-sm text-slate-300 sm:text-base">
              Students get live ETAs and stop info; drivers share their
              location with a single tap. Built with Leaflet, Socket.IO and a
              modern Next.js UI.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/student"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
              >
                Open student view
              </Link>
              <Link
                href="/driver"
                className="inline-flex items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/40 px-5 py-3 text-sm font-medium text-slate-50 backdrop-blur transition hover:border-slate-500 hover:bg-slate-900/80"
              >
                Open driver view
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20"
              >
                Open admin panel
              </Link>
            </div>
          </div>

          <div className="relative flex h-[380px] w-full items-center justify-center rounded-3xl bg-slate-900/70 p-4 shadow-2xl shadow-emerald-500/10">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-sky-500/10 to-emerald-600/5" />
            <div className="relative flex h-full w-full flex-col justify-between rounded-3xl border border-slate-800/80 bg-slate-950/70 p-4 text-xs shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Live route
                  </p>
                  <p className="text-sm font-semibold">Campus Loop - Bus 21A</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>

              <div className="mt-4 flex-1 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
                  Map preview
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-900/80 p-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Next stop
                  </p>
                  <p className="text-sm font-medium">Main Gate</p>
                  <p className="text-[11px] text-slate-400">ETA · 4-6 mins</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </p>
                  <p className="text-sm font-medium text-emerald-400">
                    On the move
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
