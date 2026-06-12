const express = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { emitDeviceStatus } = require('../socket');

const router = express.Router();

const registerSchema = z.object({
  deviceName: z.string().min(1),
  platform: z.string().optional(),
});

router.post('/register', authenticate, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const device = await prisma.device.create({
      data: {
        userId: req.user.id,
        deviceName: data.deviceName,
        platform: data.platform,
        isOnline: true,
        lastSeenAt: new Date(),
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    emitDeviceStatus(device);
    res.status(201).json(device);
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const devices = await prisma.device.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { alarms: { where: { isResolved: false } } } },
      },
      orderBy: { lastSeenAt: 'desc' },
    });
    res.json(devices);
  } catch (err) {
    next(err);
  }
});

router.get('/locations', authenticate, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const devices = await prisma.device.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        _count: { select: { alarms: { where: { isResolved: false } } } },
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    const withLocations = await Promise.all(
      devices.map(async (device) => {
        const gps = await prisma.sensorReading.findFirst({
          where: { deviceId: device.id, sensorType: 'gps' },
          orderBy: { recordedAt: 'desc' },
        });

        const payload = gps?.payload;
        const lat = payload?.lat ?? payload?.latitude;
        const lng = payload?.lng ?? payload?.longitude;

        return {
          ...device,
          location: lat != null && lng != null
            ? {
                lat,
                lng,
                accuracy: payload?.accuracy ?? null,
                recordedAt: gps.recordedAt,
              }
            : null,
        };
      })
    );

    res.json(withLocations);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const device = await prisma.device.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    if (req.user.role !== 'admin' && device.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(device);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await prisma.device.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
