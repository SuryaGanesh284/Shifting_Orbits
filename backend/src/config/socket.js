const { Server } = require('socket.io');
const logger = require('../utils/logger');
const env = require('./env');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000
  });

  io.on('connection', (socket) => {
    logger.info(`Socket client connected: ${socket.id}`);

    // Join user personal notification room
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`Socket ${socket.id} joined room user:${userId}`);
      }
    });

    // Join role-based room (e.g. coordinators)
    socket.on('join_role', (role) => {
      if (role) {
        socket.join(`role:${role}`);
        logger.debug(`Socket ${socket.id} joined room role:${role}`);
      }
    });

    // Join center room
    socket.on('join_center', (centerId) => {
      if (centerId) {
        socket.join(`center:${centerId}`);
        logger.debug(`Socket ${socket.id} joined room center:${centerId}`);
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
  if (!io) {
    logger.warn('Socket.IO not initialized yet');
  }
  return io;
};

const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, payload);
    logger.debug(`Emitted ${event} to user:${userId}`);
  }
};

const emitToRole = (role, event, payload) => {
  if (io && role) {
    io.to(`role:${role}`).emit(event, payload);
    logger.debug(`Emitted ${event} to role:${role}`);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToRole
};
