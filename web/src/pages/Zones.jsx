import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import client from '../api/client';

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function Zones() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: '', latitude: 40.1885, longitude: 29.061, radiusM: 50 });
  const [showForm, setShowForm] = useState(false);

  const loadZones = () => client.get('/danger-zones').then((res) => setZones(res.data));

  useEffect(() => {
    loadZones();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await client.post('/danger-zones', form);
    setShowForm(false);
    setForm({ name: '', latitude: 40.1885, longitude: 29.061, radiusM: 50 });
    loadZones();
  };

  const handleDelete = async (id) => {
    if (confirm('Bu bölgeyi silmek istediğinize emin misiniz?')) {
      await client.delete(`/danger-zones/${id}`);
      loadZones();
    }
  };

  const onMapClick = (latlng) => {
    if (showForm) {
      setForm((f) => ({ ...f, latitude: latlng.lat, longitude: latlng.lng }));
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Tehlikeli Bölgeler</h2>
        <p>Geofence tanımları — haritaya tıklayarak konum seçin</p>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: '1rem' }} onClick={() => setShowForm(!showForm)}>
        {showForm ? 'İptal' : 'Yeni Bölge Ekle'}
      </button>

      {showForm && (
        <form className="table-card" style={{ marginBottom: '1rem' }} onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Bölge Adı</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Yarıçap (m)</label>
              <input type="number" value={form.radiusM} onChange={(e) => setForm({ ...form, radiusM: +e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Enlem</label>
              <input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: +e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Boylam</label>
              <input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: +e.target.value })} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Kaydet</button>
        </form>
      )}

      <div className="table-card" style={{ height: 400, marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
        <MapContainer center={[40.1885, 29.061]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={onMapClick} />
          {zones.map((z) => (
            <Circle
              key={z.id}
              center={[z.latitude, z.longitude]}
              radius={z.radiusM}
              pathOptions={{ color: z.isActive ? '#ef4444' : '#94a3b8', fillOpacity: 0.2 }}
            >
              <Popup>{z.name} — {z.radiusM}m</Popup>
            </Circle>
          ))}
          {showForm && (
            <Marker position={[form.latitude, form.longitude]}>
              <Popup>Yeni bölge konumu</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Enlem</th>
              <th>Boylam</th>
              <th>Yarıçap</th>
              <th>Aktif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <td>{z.name}</td>
                <td>{z.latitude.toFixed(5)}</td>
                <td>{z.longitude.toFixed(5)}</td>
                <td>{z.radiusM} m</td>
                <td>{z.isActive ? 'Evet' : 'Hayır'}</td>
                <td>
                  <button className="btn btn-danger" onClick={() => handleDelete(z.id)}>Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
