import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import client from '../api/client';
import { useSocket } from '../hooks/useSocket';

export default function SensorCharts() {
  const { deviceId } = useParams();
  const [accelData, setAccelData] = useState([]);
  const [noiseData, setNoiseData] = useState([]);
  const [device, setDevice] = useState(null);

  const loadData = useCallback(async () => {
    const [accel, noise, dev] = await Promise.all([
      client.get(`/sensor-data?deviceId=${deviceId}&type=accelerometer&limit=50`),
      client.get(`/sensor-data?deviceId=${deviceId}&type=microphone&limit=50`),
      client.get(`/devices/${deviceId}`),
    ]);

    setAccelData(
      accel.data.map((r) => ({
        time: new Date(r.recordedAt).toLocaleTimeString('tr-TR'),
        magnitude: Math.sqrt(
          (r.payload.x || 0) ** 2 + (r.payload.y || 0) ** 2 + (r.payload.z || 0) ** 2
        ).toFixed(2),
      }))
    );

    setNoiseData(
      noise.data.map((r) => ({
        time: new Date(r.recordedAt).toLocaleTimeString('tr-TR'),
        decibels: r.payload.decibels || 0,
      }))
    );

    setDevice(dev.data);
  }, [deviceId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onSensorUpdate = useCallback(
    (data) => {
      if (data.deviceId === deviceId) loadData();
    },
    [deviceId, loadData]
  );

  const { connected, joinDevice } = useSocket(onSensorUpdate);
  useEffect(() => {
    if (deviceId) joinDevice(deviceId);
  }, [deviceId, joinDevice]);

  return (
    <div>
      <div className="page-header">
        <h2>
          {connected && <span className="live-dot" />}
          Sensör Verileri — {device?.deviceName || deviceId}
        </h2>
        <p>Zaman serisi grafikleri (ivme büyüklüğü ve gürültü)</p>
      </div>

      <div className="table-card" style={{ marginBottom: '1.5rem', height: 320 }}>
        <h3 style={{ margin: '0 0 1rem' }}>İvmeölçer Büyüklüğü (m/s²)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={accelData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="magnitude" stroke="#2563eb" dot={false} name="İvme" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="table-card" style={{ height: 320 }}>
        <h3 style={{ margin: '0 0 1rem' }}>Ortam Gürültüsü (dB)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={noiseData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" fontSize={11} />
            <YAxis fontSize={11} domain={[0, 120]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="decibels" stroke="#ea580c" dot={false} name="dB" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
