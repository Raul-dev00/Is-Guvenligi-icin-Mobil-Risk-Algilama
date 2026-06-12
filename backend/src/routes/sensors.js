const express = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { analyzeReadings } = require('../services/analysisService');
const { emitSensorUpdate, emitDeviceStatus } = require('../socket');

const router = express.Router();

const readingSchema = z.object({
  sensorType: z.enum(['accelerometer', 'gps', 'microphone', 'network']),
  payload: z.record(z.any()),
  recordedAt: z.string().datetime(),
});

const ingestSchema = z.object({
  deviceId: z.string().uuid(),
  readings: z.array(readingSchema).min(1),
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { deviceId, readings } = ingestSchema.parse(req.body);

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (req.user.role !== 'admin' && device.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const created = await prisma.$transaction(
      readings.map((r) =>
        prisma.sensorReading.create({
          data: {
            deviceId,
            sensorType: r.sensorType,
            payload: r.payload,
            recordedAt: new Date(r.recordedAt),
          },
        })
      )
    );

    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date(), isOnline: true },
    });

    const analysis = await analyzeReadings(
      deviceId,
      readings.map((r, i) => ({
        sensorType: r.sensorType,
        payload: r.payload,
        recordedAt: created[i].recordedAt,
      }))
    );

    const updatePayload = {
      deviceId,
      readings: created,
      riskScore: analysis.riskScore,
      newAlarms: analysis.alarms,
    };

    emitSensorUpdate(deviceId, updatePayload);
    emitDeviceStatus(updatedDevice);

    res.status(201).json({
      saved: created.length,
      riskScore: analysis.riskScore,
      alarms: analysis.alarms,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { deviceId, type, from, to, limit = '100' } = req.query;
    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const device = await prisma.device.findUnique({ where: { id: deviceId } });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (req.user.role !== 'admin' && device.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where = { deviceId };
    if (type) where.sensorType = type;
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from);
      if (to) where.recordedAt.lte = new Date(to);
    }

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 100, 500),
    });

    res.json(readings.reverse());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
