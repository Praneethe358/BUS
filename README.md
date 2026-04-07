# BUS

## Driver realtime client (Next.js)

Install the Socket.IO client in your frontend app:

```bash
npm install socket.io-client
```

Use this client component to emit `sendLocation` every 3 seconds:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type DriverTrackerProps = {
	busId: string;
	token: string; // JWT from your auth API
	socketUrl?: string; // e.g. 'http://localhost:5000'
};

export default function DriverTracker({ busId, token, socketUrl }: DriverTrackerProps) {
	const socketRef = useRef<Socket | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const [status, setStatus] = useState('disconnected');

	useEffect(() => {
		if (!busId || !token) return;

		const socket = io(socketUrl || '/', {
			auth: { token },
			transports: ['websocket'],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
		});

		socketRef.current = socket;

		socket.on('connect', () => setStatus('connected'));
		socket.on('disconnect', () => setStatus('disconnected'));
		socket.on('connect_error', () => setStatus('error'));

		const sendLocationOnce = () => {
			if (!navigator.geolocation) {
				setStatus('geolocation_not_supported');
				return;
			}

			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const { latitude, longitude } = pos.coords;
					socket.emit('sendLocation', {
						busId,
						lat: latitude,
						lng: longitude,
					});
				},
				() => {
					setStatus('geolocation_error');
				},
				{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
			);
		};

		sendLocationOnce();
		timerRef.current = setInterval(sendLocationOnce, 3000);

		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			socket.disconnect();
			socketRef.current = null;
		};
	}, [busId, token, socketUrl]);

	return <p>Socket status: {status}</p>;
}
```

	## Socket.IO security and usage

	### Authentication (handshake)

	- The backend uses JWT on the Socket.IO handshake.
	- Clients must pass the token as:
		- `auth: { token: '<JWT>' }` when calling `io(SERVER_URL, { auth })`.
	- On the server side (already implemented in `src/sockets/index.js`):
		- The token is verified with `JWT_SECRET`.
		- The user is loaded from MongoDB and attached as `socket.user`.
		- Connections without a valid token are rejected.

	### Driver: sendLocation (secured)

	- Only users with `role: 'driver'` may emit `sendLocation`.
	- The driver must be assigned a `busId` in the database.
	- On `sendLocation`:
		- Server checks `socket.user.role === 'driver'`.
		- Server checks `socket.user.busId === payload.busId`.
		- Valid payload is broadcast to room `bus:<busId>` via `receiveLocation`.

	### Student: joinBus (secured)

	- Only users with `role: 'student'` may join a bus room.
	- The student must be assigned a `busId` in the database.
	- Client emits `joinBus` with `{ busId }`.
	- On `joinBus`:
		- Server checks `socket.user.role === 'student'`.
		- Server checks `socket.user.busId === busId`.
		- If authorized, socket joins room `bus:<busId>` and receives `joinedBus`.

	### Rooms and events

	- Each bus has a dedicated room: `bus:<busId>`.
	- Events:
		- `joinBus` → student asks to join their bus room.
		- `joinedBus` → server confirms student joined the room.
		- `sendLocation` → driver sends GPS updates.
		- `receiveLocation` → server broadcasts bus location to all students in that bus room.
		- `error` → server sends security/validation errors for unauthorized or invalid actions.

	This ensures only authenticated drivers can publish locations for their bus, and only authenticated students subscribed to that same bus receive those updates.
