const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const User = require('../models/userModel');
const registerBusHandlers = require('./busHandlers');
const { SOCKET_EVENTS } = require('./constants');

const getTokenFromHandshake = (socket) => {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    return socket.handshake.auth.token;
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
};

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) {
        return next(new Error('Not authorized, token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Not authorized, user not found'));
      }

      socket.user = user;
      socket.events = SOCKET_EVENTS;
      return next();
    } catch (err) {
      return next(new Error('Not authorized, invalid token'));
    }
  });

  io.on('connection', (socket) => {
    registerBusHandlers(io, socket);
  });

  return io;
};

module.exports = { setupSocket, SOCKET_EVENTS };
