import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { isRedisReady } from './config/redis.js';

import { connectDB } from './config/database.js';

import adminRoutes from './routes/adminRoute.js';
import clientRoute from './routes/clientRoute.js';
import projectRoute from './routes/projectRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import partnerRoute from './routes/partnerRoute.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI is required');
}
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'vimix-local-dev-jwt-secret';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
export const uploadsDirectory = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const frontendOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:9001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  cors({
    origin: frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

app.use('/uploads', express.static(uploadsDirectory));

app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoute);
app.use('/api/projects', projectRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/partners', partnerRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/live', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health/ready', (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const ready = mongoReady;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'not_ready',
    mongo: mongoReady ? 'connected' : 'disconnected',
    redis: isRedisReady() ? 'connected' : 'disconnected',
  });
});

(async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();