const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const env = require('./env');
const User = require('../models/User');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.CORS_ORIGINS.includes('*') || env.CORS_ORIGINS.includes(origin) || env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (token) {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.status === 'active') {
          socket.user = user;
        }
      }
      next();
    } catch (err) {
      logger.debug(`Socket connection without valid auth token: ${err.message}`);
      next(); // allow anonymous connection but without auto-room joining
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    // If authenticated via handshake, automatically join personal and role rooms
    if (socket.user) {
      const userId = socket.user._id.toString();
      const role = socket.user.role;
      const centerId = socket.user.centerId || 'SOF-BLR-01';

      socket.join(`user:${userId}`);
      socket.join(`role:${role}`);
      socket.join(`center:${centerId}`);

      logger.debug(`Socket ${socket.id} auto-joined rooms: user:${userId}, role:${role}, center:${centerId}`);
    }

    // Explicit room join handlers for client flexibility
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`Socket ${socket.id} joined user:${userId}`);
      }
    });

    socket.on('join_role', (role) => {
      if (role) {
        socket.join(`role:${role}`);
        logger.debug(`Socket ${socket.id} joined role:${role}`);
      }
    });

    socket.on('join_center', (centerId) => {
      if (centerId) {
        socket.join(`center:${centerId}`);
        logger.debug(`Socket ${socket.id} joined center:${centerId}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket client disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info('Socket.IO initialized successfully');
  return io;
};

const getIO = () => {
  return io;
};

const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, payload);
    logger.debug(`[Socket.IO] Emitted '${event}' to user:${userId}`);
  }
};

const emitToRole = (role, event, payload) => {
  if (io && role) {
    io.to(`role:${role}`).emit(event, payload);
    logger.debug(`[Socket.IO] Emitted '${event}' to role:${role}`);
  }
};

const emitToCenter = (centerId, event, payload) => {
  if (io && centerId) {
    io.to(`center:${centerId}`).emit(event, payload);
    logger.debug(`[Socket.IO] Emitted '${event}' to center:${centerId}`);
  }
};

const broadcast = (event, payload) => {
  if (io) {
    io.emit(event, payload);
    logger.debug(`[Socket.IO] Broadcasted '${event}'`);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToCenter,
  broadcast
};
