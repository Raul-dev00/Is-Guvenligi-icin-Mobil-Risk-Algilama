import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { getAlarmTypeLabel, getSeverityLabel } from '../utils/alarmLabels';

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [stats, setStats] = useState({ activeCount: 0 });
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadData = useCallback(async () => {
    const [devRes, alarmRes, statsRes] = await Promise.all([
      client.get('/devices'),
      client.get('/alarms?resolved=false&limit=10'),
      client.get('/alarms/stats'),
    ]);
    setDevices(devRes.data);
    setAlarms(alarmRes.data);
    setStats(statsRes.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSensorUpdate = useCallback(() => {
    setLastUpdate(new Date());
    loadData();
  }, [loadData]);

  const onAlarmNew = useCallback((alarm) => {
    setAlarms((prev) => [alarm, ...prev].slice(0, 10));
    setStats((s) => ({ ...s, activeCount: s.activeCount + 1 }));
  }, []);

  const onDeviceStatus = useCallback((device) => {
    setDevices((prev) => prev.map((d) => (d.id === device.id ? { ...d, ...device } : d)));
  }, []);

  const { connected } = useSocket(onSensorUpdate, onAlarmNew, onDeviceStatus);

  return (
    <div>
      <div className="page-header">
        <h2>
          {connected && <span className="live-dot" />}
          Dashboard
        </h2>
        <p>Canlı cihaz izleme ve aktif alarmlar</p>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <h3>{devices.length}</h3>
          <p>Toplam Cihaz</p>
        </div>
        <div className="stat-card">
          <h3>{devices.filter((d) => d.isOnline).length}</h3>
          <p>Çevrimiçi Cihaz</p>
        </div>
        <div className="stat-card danger">
          <h3>{stats.activeCount}</h3>
          <p>Aktif Alarm</p>
        </div>
        <div className="stat-card">
          <h3>{lastUpdate ? lastUpdate.toLocaleTimeString('tr-TR') : '—'}</h3>
          <p>Son Güncelleme</p>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem' }}>Cihazlar</h3>
        <table>
          <thead>
            <tr>
              <th>Cihaz</th>
              <th>Çalışan</th>
              <th>Durum</th>
              <th>Son Görülme</th>
              <th>Aktif Alarm</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.deviceName}</td>
                <td>{d.user?.fullName}</td>
                <td>
                  <span className={`badge ${d.isOnline ? 'online' : 'offline'}`}>
                    {d.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </span>
                </td>
                <td>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString('tr-TR') : '—'}</td>
                <td>{d._count?.alarms || 0}</td>
                <td>
                  <Link to={`/sensors/${d.id}`} className="btn btn-secondary">
                    Grafikler
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-card">
        <h3 style={{ margin: '0 0 1rem' }}>Son Alarmlar</h3>
        <table>
          <thead>
            <tr>
              <th>Zaman</th>
              <th>Tip</th>
              <th>Mesaj</th>
              <th>Risk</th>
              <th>Önem</th>
            </tr>
          </thead>
          <tbody>
            {alarms.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.createdAt).toLocaleString('tr-TR')}</td>
                <td>{getAlarmTypeLabel(a.alarmType)}</td>
                <td>{a.message}</td>
                <td>{a.riskScore?.toFixed(0)}</td>
                <td><span className={`badge ${a.severity}`}>{getSeverityLabel(a.severity)}</span></td>
              </tr>
            ))}
            {alarms.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>Aktif alarm yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
