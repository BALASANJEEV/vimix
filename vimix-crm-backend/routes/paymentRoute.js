import express from 'express';
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
} from '../controllers/paymentController.js';
import { requireRole } from '../middleware/verifyPartner.js';

const router = express.Router();

// Protect all routes: only admins and partners
router.post('/', requireRole('admin', 'partner'), createPayment);
router.get('/', requireRole('admin', 'partner'), getAllPayments);
router.get('/:id', requireRole('admin', 'partner'), getPaymentById);
router.put('/:id', requireRole('admin', 'partner'), updatePayment);
router.delete('/:id', requireRole('admin', 'partner'), deletePayment);

export default router;
