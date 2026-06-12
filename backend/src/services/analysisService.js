const prisma = require('../config/db');
const { isInsideZone } = require('./geofenceService');

const THRESHOLDS = {
  IMPACT_MAGNITUDE: 25,
  FALL_INACTIVITY_SEC: 3,
  INACTIVITY_MINUTES: 10,
  NOISE_DB: 85,
  Z_SCORE: 2.5,
  HIGH_RISK_SCORE: 70,
  ROLLING_WINDOW: 30,
};

const deviceState = new Map();

function getDeviceState(deviceId) {
  if (!deviceState.has(deviceId)) {
    deviceState.set(deviceId, {
      lastImpactAt: null,
      lastMovementAt: new Date(),
      inDangerZone: false,
      lastAlarmAt: {},
    });
  }
  return deviceState.get(deviceId);
}

function magnitude(payload) {
  const { x = 0, y = 0, z = 0 } = payload;
  return Math.sqrt(x * x + y * y + z * z);
}

function calcZScore(values, current) {
  if (values.length < 5) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return Math.abs((current - mean) / std);
}

function severityFromRisk(score) {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

async function shouldThrottleAlarm(deviceId, alarmType, minutes = 5) {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  const existing = await prisma.alarm.findFirst({
    where: {
      deviceId,
      alarmType,
      isResolved: false,
      createdAt: { gte: since },
    },
  });
  return !!existing;
}

async function createAlarm(deviceId, alarmType, message, riskScore, metadata = null) {
  const throttled = await shouldThrottleAlarm(deviceId, alarmType);
  if (throttled) return null;

  const severity = severityFromRisk(riskScore);
  const alarm = await prisma.alarm.create({
    data: {
      deviceId,
      alarmType,
      severity,
      message,
      riskScore,
      metadata,
    },
    include: {
      device: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
    },
  });

  const { getIO } = require('../socket');
  const io = getIO();
  if (io) {
    io.to('admin').emit('alarm:new', alarm);
    io.to(`device:${deviceId}`).emit('alarm:new', alarm);
  }

  const { sendTelegramAlert } = require('./telegramService');
  sendTelegramAlert(alarm).catch((err) => console.error('Telegram alert error:', err));

  return alarm;
}

async function analyzeReadings(deviceId, readings) {
  const state = getDeviceState(deviceId);
  const alarms = [];
  let riskContributions = [];

  for (const reading of readings) {
    const { sensorType, payload, recordedAt } = reading;
    const ts = new Date(recordedAt);

    if (sensorType === 'accelerometer') {
      const mag = magnitude(payload);
      const isMoving = mag > 1.5;

      if (isMoving) {
        state.lastMovementAt = ts;
      }

      const recentAccel = await prisma.sensorReading.findMany({
        where: { deviceId, sensorType: 'accelerometer' },
        orderBy: { recordedAt: 'desc' },
        take: THRESHOLDS.ROLLING_WINDOW,
        select: { payload: true },
      });

      const magnitudes = recentAccel.map((r) => magnitude(r.payload));
      const z = calcZScore(magnitudes, mag);
      if (z > THRESHOLDS.Z_SCORE) {
        riskContributions.push(30);
      }

      if (mag > THRESHOLDS.IMPACT_MAGNITUDE) {
        state.lastImpactAt = ts;
        const alarm = await createAlarm(
          deviceId,
          'hard_impact',
          `Sert darbe algılandı (ivme: ${mag.toFixed(1)} m/s²)`,
          60,
          { magnitude: mag, recordedAt }
        );
        if (alarm) alarms.push(alarm);
      }

      if (
        state.lastImpactAt &&
        (ts - state.lastImpactAt) / 1000 >= THRESHOLDS.FALL_INACTIVITY_SEC &&
        !isMoving
      ) {
        const alarm = await createAlarm(
          deviceId,
          'fall_suspected',
          'Düşme şüphesi: darbe sonrası hareketsizlik tespit edildi',
          80,
          { magnitude: mag, recordedAt }
        );
        if (alarm) alarms.push(alarm);
        state.lastImpactAt = null;
      }

      const inactiveMs = Date.now() - state.lastMovementAt.getTime();
      if (inactiveMs > THRESHOLDS.INACTIVITY_MINUTES * 60 * 1000) {
        const alarm = await createAlarm(
          deviceId,
          'inactivity',
          `Uzun süre hareketsizlik (${THRESHOLDS.INACTIVITY_MINUTES} dk)`,
          50,
          { inactiveMinutes: THRESHOLDS.INACTIVITY_MINUTES }
        );
        if (alarm) alarms.push(alarm);
      }
    }

    if (sensorType === 'gps' && payload.lat != null && payload.lng != null) {
      const zones = await prisma.dangerZone.findMany({ where: { isActive: true } });
      const insideAny = zones.some((z) => isInsideZone(payload.lat, payload.lng, z));

      if (insideAny && !state.inDangerZone) {
        const zone = zones.find((z) => isInsideZone(payload.lat, payload.lng, z));
        const alarm = await createAlarm(
          deviceId,
          'danger_zone_entry',
          `Tehlikeli bölgeye giriş: ${zone?.name || 'Bilinmeyen bölge'}`,
          75,
          { lat: payload.lat, lng: payload.lng, zoneId: zone?.id }
        );
        if (alarm) alarms.push(alarm);
      }
      state.inDangerZone = insideAny;
      if (insideAny) riskContributions.push(40);
    }

    if (sensorType === 'microphone' && payload.decibels != null) {
      if (payload.decibels > THRESHOLDS.NOISE_DB) {
        const alarm = await createAlarm(
          deviceId,
          'high_noise',
          `Tehlikeli gürültü seviyesi: ${payload.decibels.toFixed(0)} dB`,
          45,
          { decibels: payload.decibels }
        );
        if (alarm) alarms.push(alarm);
        riskContributions.push(25);
      }
    }

    if (sensorType === 'network' && payload.connected === false) {
      const alarm = await createAlarm(
        deviceId,
        'network_lost',
        'Cihaz ağ bağlantısı koptu, çalışana ulaşılamıyor',
        55,
        { networkType: payload.type }
      );
      if (alarm) alarms.push(alarm);
      riskContributions.push(35);
    }
  }

  const riskScore = Math.min(
    100,
    riskContributions.length ? riskContributions.reduce((a, b) => a + b, 0) / riskContributions.length + 20 : 10
  );

  if (riskScore >= THRESHOLDS.HIGH_RISK_SCORE) {
    const alarm = await createAlarm(
      deviceId,
      'high_risk_score',
      `Yüksek risk puanı oluştu: ${riskScore.toFixed(0)}`,
      riskScore
    );
    if (alarm) alarms.push(alarm);
  }

  return { alarms, riskScore };
}

module.exports = { analyzeReadings, THRESHOLDS };
