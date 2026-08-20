import { Router } from 'express';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientDetails
} from '../controllers/clientController.js';
import { requireRole } from '../middleware/verifyPartner.js'; // role-based middleware

const router = Router();

// Create client → admin or partner
router.post('/', requireRole('admin', 'partner'), createClient);

// Get all clients → admin sees all, partner sees own
router.get('/', requireRole('admin', 'partner'), getClients);

// Get single client → admin sees all, partner sees own
router.get('/:id', requireRole('admin', 'partner'), getClient);

// Get client details → admin sees all, partner sees own
router.get('/:id/details', requireRole('admin', 'partner'), getClientDetails);

// Update client → admin sees all, partner sees own
router.put('/:id', requireRole('admin', 'partner'), updateClient);

// Delete client → admin sees all, partner sees own
router.delete('/:id', requireRole('admin', 'partner'), deleteClient);

export default router;
