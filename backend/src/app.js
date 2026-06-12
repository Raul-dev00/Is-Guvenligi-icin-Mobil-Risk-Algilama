const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/devices');
const sensorRoutes = require('./routes/sensors');
const alarmRoutes = require('./routes/alarms');
const zoneRoutes = require('./routes/zones');

const app = express();

app.use(cors({ origin: env.corsOrigins, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensor-data', sensorRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/danger-zones', zoneRoutes);

app.use(errorHandler);

module.exports = app;
