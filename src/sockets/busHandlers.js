const { SOCKET_EVENTS } = require('./constants');

const buildBusRoom = (busId) => `bus:${busId}`;

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
    if (!socket.user || socket.user.role !== 'student') {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Only students can join bus rooms' });
      return;
    }

    const assignedBusId = socket.user.busId ? socket.user.busId.toString() : null;
    if (!assignedBusId || assignedBusId !== busId) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Not authorized for this bus' });
      return;
    }

    socket.join(buildBusRoom(busId));
    socket.emit(SOCKET_EVENTS.JOINED_BUS, { busId });
  });

  socket.on(SOCKET_EVENTS.SEND_LOCATION, (payload = {}) => {
    if (!socket.user || socket.user.role !== 'driver') {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Only drivers can send location' });
      return;
    }

    const assignedBusId = socket.user.busId ? socket.user.busId.toString() : null;
    if (!assignedBusId || assignedBusId !== payload.busId) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Not authorized for this bus' });
      return;
    }

    if (!isValidLocation(payload)) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid location payload' });
      return;
    }

    const room = buildBusRoom(payload.busId);
    const location = {
      busId: payload.busId,
      lat: payload.lat,
      lng: payload.lng,
      speed: typeof payload.speed === 'number' ? payload.speed : undefined,
      heading: typeof payload.heading === 'number' ? payload.heading : undefined,
      timestamp: typeof payload.timestamp === 'number' ? payload.timestamp : Date.now(),
      driverId: socket.user._id,
    };

    io.to(room).emit(SOCKET_EVENTS.RECEIVE_LOCATION, location);
  });
};

module.exports = registerBusHandlers;
