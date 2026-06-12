import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import client from '../api/client';
import { useSocket } from '../hooks/useSocket';
import './MapTracking.css';

const DEFAULT_CENTER = [40.1885, 29.061];
const DEFAULT_ZOOM = 14;

function FitBounds({ devices }) {
  const map = useMap();
  const boundsKey = devices
    .filter((d) => d.location)
    .map((d) => `${d.id}:${d.location.lat},${d.location.lng}`)
    .join('|');

  useEffect(() => {
    const points = devices
      .filter((d) => d.location)
      .map((d) => [d.location.lat, d.location.lng]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points, { padding: [40, 40] });
  }, [map, boundsKey, devices]);

  return null;
}

export default function MapTracking() {
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [devRes, zoneRes] = await Promise.all([
      client.get('/devices/locations'),
      client.get('/danger-zones'),
    ]);
    setDevices(devRes.data);
    setZones(zoneRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const onSensorUpdate = useCallback((data) => {
    const gps = data.readings?.find((r) => r.sensorType === 'gps');
    if (!gps?.payload) return;

    const lat = gps.payload.lat ?? gps.payload.latitude;
    const lng = gps.payload.lng ?? gps.payload.longitude;
    if (lat == null || lng == null) return;

    setDevices((prev) =>
      prev.map((d) =>
        d.id === data.deviceId
          ? {
              ...d,
              isOnline: true,
              lastSeenAt: new Date().toISOString(),
              location: {
                lat,
                lng,
                accuracy: gps.payload.accuracy ?? null,
                recordedAt: gps.recordedAt,
              },
            }
          : d
      )
    );
  }, []);

  const onDeviceStatus = useCallback((device) => {
    setDevices((prev) => prev.map((d) => (d.id === device.id ? { ...d, ...device } : d)));
  }, []);

  const { connected } = useSocket(onSensorUpdate, null, onDeviceStatus);

  const locatedDevices = useMemo(
    () => devices.filter((d) => d.location),
    [devices]
  );

  const mapCenter = locatedDevices.length > 0
    ? [locatedDevices[0].location.lat, locatedDevices[0].location.lng]
    : DEFAULT_CENTER;

  if (loading) {
    return <div className="map-loading">Harita yükleniyor...</div>;
  }

  return (
    <div className="map-tracking">
      <div className="page-header">
        <h2>
          {connected && <span className="live-dot" />}
          Harita İzleme
        </h2>
        <p>Cihazların canlı konumları ve tehlikeli bölgeler</p>
      </div>

      <div className="map-layout">
        <aside className="device-panel">
          <h3>Cihazlar ({devices.length})</h3>
          <div className="device-list">
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`device-item ${selectedId === d.id ? 'selected' : ''} ${!d.location ? 'no-location' : ''}`}
                onClick={() => setSelectedId(d.id)}
              >
                <div className="device-item-header">
                  <span className={`status-dot ${d.isOnline ? 'online' : 'offline'}`} />
                  <strong>{d.deviceName}</strong>
                </div>
                <span className="device-employee">{d.user?.fullName}</span>
                {d.location ? (
                  <span className="device-coords">
                    {d.location.lat.toFixed(5)}, {d.location.lng.toFixed(5)}
                  </span>
                ) : (
                  <span className="device-coords muted">Konum verisi yok</span>
                )}
                {d._count?.alarms > 0 && (
                  <span className="device-alarms">{d._count.alarms} aktif alarm</span>
                )}
              </button>
            ))}
            {devices.length === 0 && (
              <p className="empty-msg">Kayıtlı cihaz bulunamadı</p>
            )}
          </div>

          <div className="map-legend">
            <h4>Gösterge</h4>
            <div><span className="legend-dot online" /> Çevrimiçi</div>
            <div><span className="legend-dot offline" /> Çevrimdışı</div>
            <div><span className="legend-zone" /> Tehlikeli bölge</div>
          </div>
        </aside>

        <div className="map-container">
          <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} className="tracking-map">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FitBounds devices={devices} />

            {zones.filter((z) => z.isActive).map((z) => (
              <Circle
                key={z.id}
                center={[z.latitude, z.longitude]}
                radius={z.radiusM}
                pathOptions={{ color: '#ef4444', fillOpacity: 0.12, weight: 2 }}
              >
                <Popup>
                  <strong>{z.name}</strong>
                  <br />
                  Yarıçap: {z.radiusM} m
                </Popup>
              </Circle>
            ))}

            {devices.map((d) => {
              if (!d.location) return null;
              const isSelected = selectedId === d.id;
              return (
                <CircleMarker
                  key={d.id}
                  center={[d.location.lat, d.location.lng]}
                  radius={isSelected ? 12 : 9}
                  pathOptions={{
                    color: isSelected ? '#1d4ed8' : d.isOnline ? '#16a34a' : '#94a3b8',
                    fillColor: d.isOnline ? '#22c55e' : '#cbd5e1',
                    fillOpacity: 0.9,
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{ click: () => setSelectedId(d.id) }}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>{d.deviceName}</strong>
                      <p>{d.user?.fullName}</p>
                      <p>
                        Durum:{' '}
                        <span className={d.isOnline ? 'text-online' : 'text-offline'}>
                          {d.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                        </span>
                      </p>
                      <p>Son konum: {new Date(d.location.recordedAt).toLocaleString('tr-TR')}</p>
                      {d.location.accuracy != null && (
                        <p>Hassasiyet: ±{d.location.accuracy.toFixed(0)} m</p>
                      )}
                      {d._count?.alarms > 0 && (
                        <p className="text-alarm">{d._count.alarms} aktif alarm</p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
