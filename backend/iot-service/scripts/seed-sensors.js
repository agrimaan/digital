/* eslint-disable no-console */
require('dotenv').config();
const axios = require('axios');

// ====== CONFIG via .env ======
const IOT_URL = process.env.IOT_SERVICE_URL || 'http://localhost:3004'; // <- adjust to your iot-service port
const ADMIN_TOKEN = process.env.JWT_SECRET || '';                       // JWT with permission to create sensors
const DEFAULT_FIELD_ID = process.env.DEFAULT_FIELD_ID || '';             // optional: pre-assign all sensors to a field

// Axios client
const api = axios.create({
  baseURL: IOT_URL,
  headers: ADMIN_TOKEN ? { Authorization: `Bearer ${ADMIN_TOKEN}` } : {},
  timeout: 15000,
});

// ====== Seed Data (edit freely) ======
/** Sensor payloads follow SensorSlice type */
const SENSORS = [
  {
    name: 'Soil Moisture Sensor — North',
    type: 'soil_moisture',
    Fields: DEFAULT_FIELD_ID, // string id or leave '' to assign later
    location: { type: 'Point', coordinates: [77.5946, 12.9716] }, // [lng, lat] Bengaluru
    manufacturer: 'AgroSense',
    model: 'MS-200',
    serialNumber: 'MS2-2024-0001',
    installationDate: new Date('2024-01-15'),
    batteryLevel: 84,
    status: 'active',
    firmwareVersion: 'v2.3.1',
    measurementUnit: '%',
    measurementRange: { min: 0, max: 100 },
    accuracy: 2,
    calibrationDate: new Date('2024-04-01'),
    dataTransmissionInterval: 15, // minutes
    notes: 'Installed pre-monsoon',
  },
  {
    name: 'Air Temperature — East',
    type: 'temperature',
    Fields: DEFAULT_FIELD_ID,
    location: { type: 'Point', coordinates: [72.8777, 19.0760] }, // Mumbai
    manufacturer: 'MeteoTech',
    model: 'AT-10',
    serialNumber: 'AT10-2024-1107',
    installationDate: new Date('2024-02-20'),
    batteryLevel: 67,
    status: 'active',
    firmwareVersion: 'v1.9.0',
    measurementUnit: '°C',
    measurementRange: { min: -10, max: 60 },
    accuracy: 0.5,
    calibrationDate: new Date('2024-05-10'),
    dataTransmissionInterval: 5,
    notes: 'Mounted on 2m mast',
  },
  {
    name: 'Humidity — South Plot',
    type: 'humidity',
    Fields: DEFAULT_FIELD_ID,
    location: { type: 'Point', coordinates: [80.2707, 13.0827] }, // Chennai
    manufacturer: 'EnviroLabs',
    model: 'HUM-360',
    serialNumber: 'HUM360-2024-5012',
    installationDate: new Date('2024-03-05'),
    batteryLevel: 52,
    status: 'maintenance',
    firmwareVersion: 'v3.1.2',
    measurementUnit: '%',
    measurementRange: { min: 0, max: 100 },
    accuracy: 1,
    calibrationDate: new Date('2024-06-18'),
    dataTransmissionInterval: 30,
    notes: 'Needs recalibration',
  },
];

// optional demo time-series (last hour)
function demoReadingsFor(sensor) {
  const now = Date.now();
  const make = (minsAgo, value) => ({
    value,
    timestamp: new Date(now - minsAgo * 60 * 1000),
  });

  switch (sensor.type) {
    case 'soil_moisture':
      return [40, 39, 38, 37, 39].map((v, i) => make((i + 1) * 15, v));
    case 'temperature':
      return [29.8, 30.1, 30.4, 30.0, 29.7].map((v, i) => make((i + 1) * 12, v));
    case 'humidity':
      return [64, 63, 65, 66, 64].map((v, i) => make((i + 1) * 10, v));
    default:
      return [make(30, 1), make(15, 2)];
  }
}

function demoAlertsFor(sensor) {
  const now = new Date();
  const alerts = [];

  if (sensor.batteryLevel != null && sensor.batteryLevel < 30) {
    alerts.push({
      type: 'low_battery',
      message: `Battery low: ${sensor.batteryLevel}%`,
      timestamp: now,
      resolved: false,
    });
  }
  if (sensor.status === 'maintenance') {
    alerts.push({
      type: 'connection_lost',
      message: 'Intermittent connection during maintenance',
      timestamp: new Date(now.getTime() - 24 * 3600 * 1000),
      resolved: true,
      resolvedAt: now,
    });
  }
  return alerts;
}

// ====== Helpers ======
async function findBySerial(serialNumber) {
  // Prefer a filtered endpoint if you have it: /api/sensors?serialNumber=...
  try {
    const res = await api.get('/api/sensors/devices', { params: { serialNumber } });
    const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
    return list.find((s) => s.serialNumber === serialNumber) || null;
  } catch {
    // Fallback: fetch all and search locally (ok for small data sets)
    const res = await api.get('/api/sensors/devices');
    const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
    return list.find((s) => s.serialNumber === serialNumber) || null;
  }
}

async function createOrUpdateSensor(payload) {
  const existing = await findBySerial(payload.serialNumber);
  if (existing) {
    const { _id } = existing;
    const res = await api.put(`/api/sensors/devices/${_id}`, payload);
    console.log(`↑ updated sensor ${payload.serialNumber} -> ${_id}`);
    return res.data?._id || _id;
  }
  const res = await api.post('/api/sensors/devices', payload);
  const created = res.data?.data || res.data;
  console.log(`+ created sensor ${payload.serialNumber} -> ${created._id}`);
  return created._id;
}

async function addReadings(sensorId, readings) {
  if (!readings?.length) return;
  for (const r of readings) {
    await api.post(`/api/sensors/devices/${sensorId}/reading`, r);
  }
  console.log(`  • ${readings.length} readings added for ${sensorId}`);
}

async function addAlerts(sensorId, alerts) {
  if (!alerts?.length) return;
  for (const a of alerts) {
    await api.post(`/api/sensors/devices/${sensorId}/alert`, a);
  }
  console.log(`  • ${alerts.length} alerts added for ${sensorId}`);
}

// ====== Runner ======
async function run() {
  if (!IOT_URL) throw new Error('IOT_SERVICE_URL is not set');
  console.log('[seed] iot-service:', IOT_URL);

  if (!ADMIN_TOKEN) {
    console.warn('[seed] ADMIN_TOKEN not set — seeding may fail if the API is protected.');
  }

  // Seed sensors
  for (const base of SENSORS) {
    try {
      const id = await createOrUpdateSensor(base);

      // optional: seed demo readings & alerts
      await addReadings(id, demoReadingsFor(base));
      await addAlerts(id, demoAlertsFor(base));
    } catch (e) {
      console.error('seed error for', base.serialNumber, e?.response?.data || e.message);
    }
  }

  console.log('[seed] done');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
