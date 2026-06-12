const express = require('express');
const { z } = require('zod');
const prisma = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const zoneSchema = z.object({
  name: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusM: z.number().positive(),
  isActive: z.boolean().optional(),
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const zones = await prisma.dangerZone.findMany({ orderBy: { name: 'asc' } });
    res.json(zones);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const data = zoneSchema.parse(req.body);
    const zone = await prisma.dangerZone.create({ data });
    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const data = zoneSchema.partial().parse(req.body);
    const zone = await prisma.dangerZone.update({
      where: { id: req.params.id },
      data,
    });
    res.json(zone);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await prisma.dangerZone.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
