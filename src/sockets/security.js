const { SOCKET_EVENTS } = require('./constants');

const emitSecurityError = (socket, message) => {
  socket.emit(SOCKET_EVENTS.ERROR, { message });
};

const ensureAuthenticated = (socket) => {
  if (!socket.user) {
    emitSecurityError(socket, 'Not authenticated');
    return false;
  }
  return true;
};

const ensureRole = (socket, role) => {
  if (!ensureAuthenticated(socket)) return false;

  if (socket.user.role !== role) {
    emitSecurityError(socket, `Only ${role}s can perform this action`);
    return false;
  }

  return true;
};

const ensureStudentForBus = (socket, busId) => {
  if (!ensureRole(socket, 'student')) return false;

  const assignedBusId = socket.user.busId ? socket.user.busId.toString() : null;
  if (!assignedBusId || assignedBusId !== busId) {
    emitSecurityError(socket, 'Not authorized for this bus');
    return false;
  }

  return true;
};

const ensureDriverForBus = (socket, busId) => {
  if (!ensureRole(socket, 'driver')) return false;

  const assignedBusId = socket.user.busId ? socket.user.busId.toString() : null;
  if (!assignedBusId || assignedBusId !== busId) {
    emitSecurityError(socket, 'Not authorized for this bus');
    return false;
  }

  return true;
};

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensureStudentForBus,
  ensureDriverForBus,
};
