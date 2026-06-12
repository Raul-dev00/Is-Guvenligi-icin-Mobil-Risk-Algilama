import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

export default function Devices() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    client.get('/devices').then((res) => setDevices(res.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Cihazlar</h2>
        <p>Kayıtlı mobil cihazlar ve durumları</p>
      </div>
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Cihaz Adı</th>
              <th>Platform</th>
              <th>Çalışan</th>
              <th>Durum</th>
              <th>Son Görülme</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td>{d.deviceName}</td>
                <td>{d.platform || '—'}</td>
                <td>{d.user?.fullName}</td>
                <td>
                  <span className={`badge ${d.isOnline ? 'online' : 'offline'}`}>
                    {d.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                  </span>
                </td>
                <td>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString('tr-TR') : '—'}</td>
                <td>
                  <Link to={`/sensors/${d.id}`} className="btn btn-primary">Sensör Verileri</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
