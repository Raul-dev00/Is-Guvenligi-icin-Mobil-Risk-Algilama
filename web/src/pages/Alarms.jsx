import { useEffect, useState } from 'react';
import client from '../api/client';
import { ALARM_TYPE_LABELS, getAlarmTypeLabel, getSeverityLabel } from '../utils/alarmLabels';

const ALARM_TYPES = Object.keys(ALARM_TYPE_LABELS);

export default function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [filter, setFilter] = useState({ type: '', resolved: 'false' });

  const loadAlarms = () => {
    const params = new URLSearchParams({ limit: '100' });
    if (filter.type) params.set('type', filter.type);
    if (filter.resolved) params.set('resolved', filter.resolved);
    client.get(`/alarms?${params}`).then((res) => setAlarms(res.data));
  };

  useEffect(() => {
    loadAlarms();
  }, [filter]);

  const resolveAlarm = async (id) => {
    await client.patch(`/alarms/${id}/resolve`);
    loadAlarms();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Alarmlar</h2>
        <p>Risk ve anomali kayıtları</p>
      </div>

      <div className="table-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label>Alarm Tipi</label>
            <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
              <option value="">Tümü</option>
              {ALARM_TYPES.map((t) => (
                <option key={t} value={t}>{ALARM_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label>Durum</label>
            <select value={filter.resolved} onChange={(e) => setFilter({ ...filter, resolved: e.target.value })}>
              <option value="false">Aktif</option>
              <option value="true">Çözülmüş</option>
              <option value="">Tümü</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Cihaz</th>
              <th>Çalışan</th>
              <th>Tip</th>
              <th>Mesaj</th>
              <th>Risk</th>
              <th>Önem</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {alarms.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.createdAt).toLocaleString('tr-TR')}</td>
                <td>{a.device?.deviceName}</td>
                <td>{a.device?.user?.fullName}</td>
                <td>{getAlarmTypeLabel(a.alarmType)}</td>
                <td>{a.message}</td>
                <td>{a.riskScore?.toFixed(0)}</td>
                <td><span className={`badge ${a.severity}`}>{getSeverityLabel(a.severity)}</span></td>
                <td>
                  {!a.isResolved && (
                    <button className="btn btn-secondary" onClick={() => resolveAlarm(a.id)}>
                      Çözüldü
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
