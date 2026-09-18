import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { connectDB } from './config/database.js';
import Admin from './models/Admin.js';

import adminRoutes from './routes/adminRoute.js';
import clientRoute from './routes/clientRoute.js';
import projectRoute from './routes/projectRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import partnerRoute from './routes/partnerRoute.js';

dotenv.config();

process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vimix';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'vimix-local-dev-jwt-secret';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:9001', 'http://127.0.0.1:9001', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoute);
app.use('/api/projects', projectRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/partners', partnerRoute);

app.get('/health', (req, res) => {
  res.json({ message: 'Server is running with MongoDB!' });
});

(async () => {
  try {
    if (!process.env.MONGO_URI.includes('localhost')) {
      await connectDB();
    } else {
      console.warn('[INFO] Skipping MongoDB connection because MONGO_URI points to localhost.');
    }

    // Attempt to create default admin but gracefully ignore DB errors
    try {
      const DEFAULT_ADMIN_USERNAME = 'nandhana@rapid24.ai';
      const existingAdmin = await Admin.findOne({ email: DEFAULT_ADMIN_USERNAME });
      if (!existingAdmin) {
        const hashed = await bcrypt.hash('password123', 10);
        await Admin.create({
          username: 'admin',
          email: DEFAULT_ADMIN_USERNAME,
          password: hashed,
        });
        console.log('[INFO] Default admin user created.');
      } else {
        console.log('[INFO] Default admin user already exists.');
      }
    } catch (adminErr) {
      console.warn('[WARN] Admin initialization failed (likely no DB):', adminErr.message);
    }

    app.listen(PORT, () => {
      console.log(`[INFO] Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('[ERROR] Server failed to start:', err);
    process.exit(1);
  }
})();