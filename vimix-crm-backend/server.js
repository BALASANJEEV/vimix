import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import sequelize from './config/database.js';
import Admin from './models/Admin.js';
import Client from './models/Client.js';
import Project from './models/Project.js';
import Payment from './models/Payment.js';

import adminRoutes from './routes/adminRoute.js';
import clientRoute from './routes/clientRoute.js';
import projectRoute from './routes/projectRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import partnerRoute from './routes/partnerRoute.js';

import './models/associations.js';

dotenv.config();

process.env.JWT_SECRET = process.env.JWT_SECRET || 'vimix-local-dev-jwt-secret';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;

/* ---------- Middleware ---------- */
app.use(express.json({ limit: '5mb' }));
app.use(
  cors({
    origin: ['http://localhost:5173'],
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
// health already below

app.get('/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

/* ---------- Database & Server Start ---------- */
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    // Ensure tables exist and associations are applied
    const syncOptions = sequelize.getDialect() === 'sqlite' ? undefined : { alter: true };
    await sequelize.sync(syncOptions);

    // Seed or reset the default local development admin user
    const DEFAULT_ADMIN_USERNAME = 'nandhana@rapid24.ai';
    const DEFAULT_ADMIN_PASSWORD_HASH = '$2b$10$sKl7ALg8wLdSQLlc9IcXK.H4.QJnLpYArhgKWoPOahWn6PlzgS/s6';

    const existingAdmin = await Admin.findOne({ where: { username: DEFAULT_ADMIN_USERNAME } });
    if (!existingAdmin) {
      await Admin.create({ username: DEFAULT_ADMIN_USERNAME, email: DEFAULT_ADMIN_USERNAME, password: DEFAULT_ADMIN_PASSWORD_HASH });
      console.log('Default local admin user created for development');
    } else if (existingAdmin.password !== DEFAULT_ADMIN_PASSWORD_HASH) {
      existingAdmin.password = DEFAULT_ADMIN_PASSWORD_HASH;
      existingAdmin.email = DEFAULT_ADMIN_USERNAME;
      await existingAdmin.save();
      console.log('Local admin password reset to default development credentials');
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  }
})();
