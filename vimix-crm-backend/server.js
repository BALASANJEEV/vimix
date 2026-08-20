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
    origin: ['http://localhost:5173', 'http://localhost:9001', 'http://127.0.0.1:9001', 'http://127.0.0.1:5173'],
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
    await connectDB();

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
      console.log('Default admin user seeded into MongoDB');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} with MongoDB`);
    });
  } catch (err) {
    console.error('Unable to start the server:', err);
    process.exit(1);
  }
})();
