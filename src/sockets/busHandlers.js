const { SOCKET_EVENTS } = require('./constants');
const { ensureStudentForBus, ensureDriverForBus } = require('./security');
const { distanceInMeters } = require('./distance');
const { getLatestLocation, setLatestLocation } = require('./locationStore');

const buildBusRoom = (busId) => `bus:${busId}`;

const MIN_MOVE_METERS = 10;
const MIN_INTERVAL_MS = 2000;

const isValidLocation = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const { busId, lat, lng } = payload;
  if (!busId) {
    return false;
  }

  const isLatValid = typeof lat === 'number' && lat >= -90 && lat <= 90;
  const isLngValid = typeof lng === 'number' && lng >= -180 && lng <= 180;

  return isLatValid && isLngValid;
};

const registerBusHandlers = (io, socket) => {
  socket.on(SOCKET_EVENTS.JOIN_BUS, ({ busId } = {}) => {
    if (!busId) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'busId is required' });
      return;
    }

    if (!ensureStudentForBus(socket, busId)) {
      return;
    }

    socket.join(buildBusRoom(busId));
    socket.emit(SOCKET_EVENTS.JOINED_BUS, { busId });
  });

  socket.on(SOCKET_EVENTS.SEND_LOCATION, (payload = {}) => {
    if (!payload.busId) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'busId is required' });
      return;
    }

    if (!ensureDriverForBus(socket, payload.busId)) {
      return;
    }

    if (!isValidLocation(payload)) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid location payload' });
      return;
    }

    const now = Date.now();
    const prev = getLatestLocation(payload.busId);

    if (prev) {
      const moved = distanceInMeters(prev.lat, prev.lng, payload.lat, payload.lng);
      const dt = now - prev.ts;

      if (moved < MIN_MOVE_METERS && dt < MIN_INTERVAL_MS) {
        // Ignore tiny and too-frequent updates
        return;
      }
    }

    const room = buildBusRoom(payload.busId);
    const location = {
      busId: payload.busId,
      lat: payload.lat,
      lng: payload.lng,
      speed: typeof payload.speed === 'number' ? payload.speed : undefined,
      heading: typeof payload.heading === 'number' ? payload.heading : undefined,
      timestamp: typeof payload.timestamp === 'number' ? payload.timestamp : now,
      driverId: socket.user._id,
    };

    setLatestLocation(payload.busId, location);

    io.to(room).emit(SOCKET_EVENTS.RECEIVE_LOCATION, location);
  });
};

module.exports = registerBusHandlers;
