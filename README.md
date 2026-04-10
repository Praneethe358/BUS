# Smart Bus Tracking System

Real-time bus tracking platform with driver and student views.

## Tech Stack

- Backend: Node.js, Express, Socket.IO, MongoDB
- Frontend: Next.js, Leaflet, Zustand, Socket.IO client

## Workflow (Up to Phase 3)

### Phase 1: Backend Foundation

Goal: Build the core backend for APIs and realtime communication.

What is implemented:

1. Project setup with Express app and modular structure under `src/`
2. MongoDB connection and models for users and buses
3. REST APIs for auth, users, and bus management
4. Socket.IO server setup with JWT handshake auth
5. Realtime events:
   - `joinBus`
   - `sendLocation`
   - `receiveLocation`

Output:

- Backend server running
- APIs working
- Realtime socket layer available

### Phase 2: Driver Tracking System

Goal: Let drivers broadcast live location.

What is implemented:

1. Driver page with start/stop location sharing controls
2. Geolocation tracking via `navigator.geolocation.watchPosition()`
3. Payload streaming with `lat`, `lng`, `speed`, `heading`, `timestamp`
4. Socket emit to backend using `sendLocation`
5. Throttled updates and location permission/error handling

Output:

- Driver can start/stop tracking
- Live location is sent to backend
- Realtime updates are available to subscribers

### Phase 3: Frontend Live Map + Tracking

Goal: Show moving bus, route, and stops in realtime.

What is implemented:

1. Map integration using Leaflet + OpenStreetMap tiles
2. Student view with:
   - live bus marker
   - route polyline
   - stop markers
   - auto-follow behavior
3. Realtime updates through Socket.IO `receiveLocation`
4. Zustand state for:
   - `busLocation`
   - `routeGeoJson`
   - `stops`
   - `etaMinutes`
5. Driver view integrated with map and sharing controls
6. UI layer includes floating info card and responsive layout
7. Smooth marker movement using interpolation and `requestAnimationFrame`
8. Fallback persistence added:
   - latest location REST endpoint (`GET /bus/location/:busId`)
   - driver writes latest location (`POST /bus/location`)
   - student refresh/poll fallback when socket auth is unavailable

Output:

- Live map with moving bus
- Driver and student tracking views
- Smooth animation
- Refresh-safe location behavior

## Realtime Data Flow

Driver phone GPS
-> Driver frontend emits location
-> Backend Socket.IO server validates and broadcasts
-> Student frontend receives and updates map state

Fallback path:

Driver frontend persists latest location through REST
-> Student frontend fetches/polls latest location on refresh/disconnect

## Current Status

- Phase 1 complete
- Phase 2 complete
- Phase 3 complete
- Admin UI panel not implemented yet (admin APIs exist)

## Available Admin APIs

- `POST /bus/create` (admin)
- `POST /bus/assign-student` (admin)

## Local Run

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm --prefix frontend run dev
```

Student view: `http://localhost:3000/student`

Driver view: `http://localhost:3000/driver`

## Viva One-liner

"Driver shares live GPS, backend streams it via sockets, and frontend updates the map in realtime with route, stops, and ETA."
