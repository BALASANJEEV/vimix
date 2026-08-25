import express from 'express';
import { getClient, updateClient } from '../controllers/clientController.js';

const router = express.Router();

// GET /api/clients/:id
router.get('/:id', getClient);

// PUT /api/clients/:id
router.put('/:id', updateClient);

export default router;