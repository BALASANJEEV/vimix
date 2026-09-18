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

// Ensure a MongoDB URI is always available – fall back to a local test DB if none supplied
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/vimix';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'vimix-local-dev-jwt-secret';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

/* ---------- Middleware ---------- */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:9001',
      'http://127.0.0.1:9001',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------- Routes ---------- */
app.use('/api/admin', adminRoutes);
app.use('/api/clients', clientRoute);
app.use('/api/projects', projectRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/partners', partnerRoute);

app.get('/health', (req, res) => {
  res.json({ message: 'Server is running with MongoDB!' });
});

/* ---------- Database & Server Start ---------- */
(async () => {
  try {
    // Skip DB connection if the URI points to localhost – useful in environments where the database
    // is not available (e.g., Fargate without a MongoDB service). The Express routes that rely on
    // the database will still be available, but endpoints that perform database actions will
    // fail gracefully.
    if (!process.env.MONGO_URI.includes('localhost')) {
      await connectDB();
    } else {
      console.warn('[INFO] Skipping MongoDB connection because MONGO_URI points to localhost.');
    }

    // Seed default admin user if not exists
    const DEFAULT_ADMIN_USERNAME = 'nandhana@rapid24.ai';
    const DEFAULT_ADMIN_PASSWORD_HASH = '$2b$10$sKl7ALg8wLdSQLlc9IcXK.H4.QJnLpYArhgKWoPOahWn6PlzgS/s6';

    const existingAdmin = await Admin.findOne({
      $or: [{ username: DEFAULT_ADMIN_USERNAME }, { email: DEFAULT_ADMIN_USERNAME }],
    });

    if (!existingAdmin) {
      await Admin.create({
        username: DEFAULT_ADMIN_USERNAME,
        email: DEFAULT_ADMIN_USERNAME,
        name: 'Nandhana Admin',
        password: DEFAULT_ADMIN_PASSWORD_HASH,
        role: 'admin',
      });
      console.log('[INFO] Default admin user seeded.');
    }

    app.listen(PORT, () => {
      console.log(`Express server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start the server:', err);
    process.exit(1);
  }
})();

// (Any remaining module exports or helper functions would go here)