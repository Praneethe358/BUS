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
