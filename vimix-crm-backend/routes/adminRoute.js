import express from 'express';
import { loginAdmin, createAdmin, getAllPartners, getPartnerById, createPartner, updatePartner, deletePartner } from '../controllers/adminController.js';
import { requireRole } from '../middleware/verifyPartner.js';

const router = express.Router();

// Public: login and create admin
router.post('/login', loginAdmin);
router.post('/create', createAdmin);

// Admin-only partner management
router.get('/partners', requireRole('admin'), getAllPartners);
router.get('/partners/:id', requireRole('admin'), getPartnerById);
router.post('/partners', requireRole('admin'), createPartner);
router.put('/partners/:id', requireRole('admin'), updatePartner);
router.delete('/partners/:id', requireRole('admin'), deletePartner);

export default router;
