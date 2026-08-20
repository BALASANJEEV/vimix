import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loginPartner, registerPartner, createPartnerProject } from '../controllers/partnerController.js';
import { uploadProjectDocument } from '../controllers/projectController.js';
import { requireRole } from '../middleware/verifyPartner.js';

const router = express.Router();

// auth
router.post('/register', registerPartner); // optional; could be admin-only in real app
router.post('/login', loginPartner);

// secure routes
router.post('/projects', requireRole, createPartnerProject);

// restrict uploads to only SRS for partners
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { id } = req.params;
    const dest = path.join(__dirname, '..', 'uploads', 'projects', id);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});
const upload = multer({ storage });

// wrapper to force docType='srs' and check ownership
router.post('/projects/:id/srs', requireRole, upload.single('file'), async (req, res, next) => {
  try {
    req.body.docType = 'srs';
    // ensure project belongs to this partner
    // Minimal inline check to avoid circular import
    const { default: Project } = await import('../models/Project.js');
    const project = await Project.findByPk(req.params.id);
    if (!project || project.partnerId !== req.user.id) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return uploadProjectDocument(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;


