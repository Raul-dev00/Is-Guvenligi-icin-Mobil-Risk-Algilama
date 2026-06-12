const express = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const where = { isResolved: false };
    if (req.user.role !== 'admin') {
      const userDevices = await prisma.device.findMany({
        where: { userId: req.user.id },
        select: { id: true },
      });
      where.deviceId = { in: userDevices.map((d) => d.id) };
    }

    const [active, byType] = await Promise.all([
      prisma.alarm.count({ where }),
      prisma.alarm.groupBy({
        by: ['alarmType'],
        where,
        _count: true,
      }),
    ]);

    res.json({ activeCount: active, byType });
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { deviceId, type, resolved, from, to, limit = '50' } = req.query;

    const where = {};
    if (deviceId) where.deviceId = deviceId;
    if (type) where.alarmType = type;
    if (resolved !== undefined) where.isResolved = resolved === 'true';
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    if (req.user.role !== 'admin') {
      const userDevices = await prisma.device.findMany({
        where: { userId: req.user.id },
        select: { id: true },
      });
      where.deviceId = { in: userDevices.map((d) => d.id) };
      if (deviceId && !userDevices.some((d) => d.id === deviceId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const alarms = await prisma.alarm.findMany({
      where,
      include: {
        device: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(parseInt(limit, 10) || 50, 200),
    });

    res.json(alarms);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/resolve', authenticate, async (req, res, next) => {
  try {
    const alarm = await prisma.alarm.findUnique({
      where: { id: req.params.id },
      include: { device: true },
    });
    if (!alarm) return res.status(404).json({ error: 'Alarm not found' });
    if (req.user.role !== 'admin' && alarm.device.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.alarm.update({
      where: { id: req.params.id },
      data: { isResolved: true, resolvedAt: new Date() },
      include: {
        device: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
