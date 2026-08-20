import express from 'express';
import {
  loginAdmin,
  registerAdmin,
  createAdmin,
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
} from '../controllers/adminController.js';
import { requireRole } from '../middleware/verifyPartner.js';

const router = express.Router();

// Public auth endpoints
router.post('/login', loginAdmin);
router.post('/register', registerAdmin);
router.post('/signup', registerAdmin);
router.post('/create', createAdmin);

// Admin-only partner management
router.get('/partners', requireRole('admin'), getAllPartners);
router.get('/partners/:id', requireRole('admin'), getPartnerById);
router.post('/partners', requireRole('admin'), createPartner);
router.put('/partners/:id', requireRole('admin'), updatePartner);
router.delete('/partners/:id', requireRole('admin'), deletePartner);

export default router;
