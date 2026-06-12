import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket(onSensorUpdate, onAlarmNew, onDeviceStatus) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (onSensorUpdate) socket.on('sensor:update', onSensorUpdate);
    if (onAlarmNew) socket.on('alarm:new', onAlarmNew);
    if (onDeviceStatus) socket.on('device:status', onDeviceStatus);

    return () => {
      socket.disconnect();
    };
  }, [onSensorUpdate, onAlarmNew, onDeviceStatus]);

  const joinDevice = (deviceId) => {
    socketRef.current?.emit('join:device', deviceId);
  };

  return { connected, joinDevice };
}
