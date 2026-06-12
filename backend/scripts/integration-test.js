/**
 * Uçtan uca API entegrasyon testi
 * Çalıştırmadan önce: docker compose up -d && npm run db:setup && npm start
 */
const BASE = process.env.API_URL || 'http://localhost:3000/api';

async function request(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status !== 204 ? await res.json().catch(() => ({})) : null;
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function run() {
  console.log('1. Health check...');
  const health = await fetch('http://localhost:3000/api/health').then((r) => r.json());
  console.log('   ', health.status);

  console.log('2. Admin login...');
  const admin = await request('POST', '/auth/login', {
    email: 'admin@isg.com',
    password: 'admin123',
  });
  console.log('   Admin:', admin.user.fullName);

  console.log('3. Employee login...');
  const employee = await request('POST', '/auth/login', {
    email: 'calisan@isg.com',
    password: 'employee123',
  });

  console.log('4. Register device...');
  const device = await request('POST', '/devices/register', {
    deviceName: 'Test Cihaz',
    platform: 'integration-test',
  }, employee.token);
  console.log('   Device:', device.id);

  console.log('5. Send sensor data (impact simulation)...');
  const now = new Date().toISOString();
  const result = await request('POST', '/sensor-data', {
    deviceId: device.id,
    readings: [
      {
        sensorType: 'accelerometer',
        payload: { x: 5, y: 10, z: 28 },
        recordedAt: now,
      },
      {
        sensorType: 'gps',
        payload: { lat: 40.1885, lng: 29.061, accuracy: 5 },
        recordedAt: now,
      },
      {
        sensorType: 'microphone',
        payload: { decibels: 90 },
        recordedAt: now,
      },
      {
        sensorType: 'network',
        payload: { connected: true, type: 'wifi' },
        recordedAt: now,
      },
    ],
  }, employee.token);
  console.log('   Saved:', result.saved, '| Alarms:', result.alarms?.length || 0);

  console.log('6. Fetch alarms...');
  const alarms = await request('GET', '/alarms?deviceId=' + device.id, null, admin.token);
  console.log('   Total alarms:', alarms.length);

  console.log('7. Fetch danger zones...');
  const zones = await request('GET', '/danger-zones', null, admin.token);
  console.log('   Zones:', zones.length);

  console.log('8. Fetch sensor history...');
  const sensors = await request('GET', `/sensor-data?deviceId=${device.id}&type=accelerometer`, null, admin.token);
  console.log('   Readings:', sensors.length);

  console.log('\n✓ Integration test completed successfully.');
}

run().catch((err) => {
  console.error('\n✗ Integration test failed:', err.message);
  console.error('Ensure PostgreSQL is running: docker compose up -d && cd backend && npm run db:setup');
  process.exit(1);
});
