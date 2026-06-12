const { haversineDistanceM, isInsideZone } = require('../src/services/geofenceService');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Geofence tests
const zone = { latitude: 40.1885, longitude: 29.061, radiusM: 50 };
assert(isInsideZone(40.1885, 29.061, zone), 'Center should be inside zone');
assert(!isInsideZone(40.2, 29.1, zone), 'Far point should be outside zone');

const dist = haversineDistanceM(40.1885, 29.061, 40.189, 29.061);
assert(dist > 0 && dist < 100, 'Distance calculation should be reasonable');

// Z-score simulation
function calcZScore(values, current) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return Math.abs((current - mean) / std);
}

const normal = Array.from({ length: 30 }, (_, i) => 9.8 + (i % 5) * 0.02);
const zNormal = calcZScore(normal, 9.85);
assert(zNormal < 2.5, 'Normal reading should have low z-score');

const zAnomaly = calcZScore(normal, 30);
assert(zAnomaly > 2.5, 'Anomaly reading should have high z-score');

// Impact magnitude
function magnitude(payload) {
  const { x = 0, y = 0, z = 0 } = payload;
  return Math.sqrt(x * x + y * y + z * z);
}
assert(magnitude({ x: 0, y: 0, z: 30 }) > 25, 'High z acceleration should trigger impact threshold');

console.log('All analysis unit tests passed.');
