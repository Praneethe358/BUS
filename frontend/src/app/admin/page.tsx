"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Bus = {
  _id: string;
  busNumber: string;
  routeName: string;
};

type Student = {
  _id: string;
  name: string;
  regNo?: string;
  email: string;
  busId?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

const parseStops = (raw: string) => {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, lat, lng] = line.split(",").map((part) => part.trim());
      return {
        name,
        lat: Number(lat),
        lng: Number(lng),
      };
    });
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [buses, setBuses] = useState<Bus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [busNumber, setBusNumber] = useState("");
  const [routeName, setRouteName] = useState("");
  const [stopsInput, setStopsInput] = useState(
    "Main Gate,12.97160,77.59460\nLibrary Circle,12.97590,77.59110"
  );

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedBusId, setSelectedBusId] = useState("");

  useEffect(() => {
    const storedToken = window.localStorage.getItem("token") || "";
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const authHeaders = useMemo(() => {
    return token
      ? ({ Authorization: `Bearer ${token}` } as Record<string, string>)
      : undefined;
  }, [token]);

  const loadData = async () => {
    if (!token) {
      setError("Admin JWT token is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [busesRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE}/bus/list`, {
          headers: authHeaders,
        }),
        fetch(`${API_BASE}/users/students`, {
          headers: authHeaders,
        }),
      ]);

      if (!busesRes.ok || !studentsRes.ok) {
        throw new Error("Failed to load admin data. Check admin token/role.");
      }

      const busesJson = (await busesRes.json()) as { buses: Bus[] };
      const studentsJson = (await studentsRes.json()) as { students: Student[] };

      setBuses(busesJson.buses || []);
      setStudents(studentsJson.students || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      void loadData();
    }
  }, [token]);

  const onCreateBus = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Admin JWT token is required.");
      return;
    }

    const stops = parseStops(stopsInput);
    const invalidStop = stops.find(
      (stop) => !stop.name || Number.isNaN(stop.lat) || Number.isNaN(stop.lng)
    );

    if (invalidStop) {
      setError("Each stop must be: name,lat,lng");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bus/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders || {}),
        },
        body: JSON.stringify({
          busNumber,
          routeName,
          stops,
        }),
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(json?.message || "Failed to create bus.");
      }

      setSuccess("Bus created successfully.");
      setBusNumber("");
      setRouteName("");
      setStopsInput("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bus.");
    }
  };

  const onAssignStudent = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError("Admin JWT token is required.");
      return;
    }

    if (!selectedStudentId || !selectedBusId) {
      setError("Select both student and bus.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bus/assign-student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders || {}),
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          busId: selectedBusId,
        }),
      });

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(json?.message || "Failed to assign student.");
      }

      setSuccess("Student assigned to bus successfully.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign student.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Bus Operations Panel</h1>
          <p className="mt-2 text-sm text-slate-300">
            Create buses and assign students. Requires an admin JWT token.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste admin JWT token"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-emerald-400/40 transition focus:ring"
            />
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Reload Data
            </button>
          </div>
        </header>

        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <form
            onSubmit={onCreateBus}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Create Bus</h2>
            <div className="mt-4 space-y-3">
              <input
                value={busNumber}
                onChange={(event) => setBusNumber(event.target.value)}
                placeholder="Bus number (e.g. 21A)"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-emerald-400/40 transition focus:ring"
              />
              <input
                value={routeName}
                onChange={(event) => setRouteName(event.target.value)}
                placeholder="Route name"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-emerald-400/40 transition focus:ring"
              />
              <textarea
                value={stopsInput}
                onChange={(event) => setStopsInput(event.target.value)}
                placeholder="One stop per line: Name,lat,lng"
                rows={6}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-emerald-400/40 transition focus:ring"
              />
            </div>
            <button
              type="submit"
              className="mt-4 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
            >
              Create Bus
            </button>
          </form>

          <form
            onSubmit={onAssignStudent}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl"
          >
            <h2 className="text-lg font-semibold">Assign Student to Bus</h2>
            <div className="mt-4 space-y-3">
              <select
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-emerald-400/40 transition focus:ring"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.regNo || student.email})
                  </option>
                ))}
              </select>

              <select
                value={selectedBusId}
                onChange={(event) => setSelectedBusId(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm outline-none ring-emerald-400/40 transition focus:ring"
              >
                <option value="">Select bus</option>
                {buses.map((bus) => (
                  <option key={bus._id} value={bus._id}>
                    {bus.busNumber} - {bus.routeName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Assign Student
            </button>
          </form>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
            <h3 className="text-base font-semibold">Buses ({buses.length})</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {buses.map((bus) => (
                <li key={bus._id} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                  {bus.busNumber} - {bus.routeName}
                </li>
              ))}
              {buses.length === 0 && !loading ? <li className="text-slate-500">No buses found.</li> : null}
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
            <h3 className="text-base font-semibold">Students ({students.length})</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {students.map((student) => (
                <li key={student._id} className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                  {student.name} - {student.regNo || student.email}
                </li>
              ))}
              {students.length === 0 && !loading ? (
                <li className="text-slate-500">No students found.</li>
              ) : null}
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
