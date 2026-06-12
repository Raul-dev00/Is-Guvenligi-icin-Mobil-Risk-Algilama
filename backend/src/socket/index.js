const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigins,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user.role === 'admin') {
      socket.join('admin');
    }
    socket.on('join:device', (deviceId) => {
      socket.join(`device:${deviceId}`);
    });
    socket.on('disconnect', () => {});
  });

  return io;
}

function getIO() {
  return io;
}

function emitSensorUpdate(deviceId, data) {
  if (!io) return;
  io.to('admin').emit('sensor:update', data);
  io.to(`device:${deviceId}`).emit('sensor:update', data);
}

function emitDeviceStatus(device) {
  if (!io) return;
  io.to('admin').emit('device:status', device);
  io.to(`device:${device.id}`).emit('device:status', device);
}

module.exports = { initSocket, getIO, emitSensorUpdate, emitDeviceStatus };
