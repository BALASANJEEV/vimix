import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { loginPartner, registerPartner, createPartnerProject } from '../controllers/partnerController.js';
import { uploadProjectDocument } from '../controllers/projectController.js';
import { requireRole } from '../middleware/verifyPartner.js';

const router = express.Router();
const rejectPublicSignup = (req, res) => res.status(403).json({ message: 'Public signup is disabled' });
const publicSignup = process.env.NODE_ENV !== 'production' || process.env.ALLOW_PUBLIC_SIGNUP === 'true';

// auth
router.post('/register', publicSignup ? registerPartner : rejectPublicSignup);
router.post('/login', loginPartner);

// secure routes
router.post('/projects', requireRole('partner'), createPartnerProject);

// restrict uploads to only SRS for partners
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { id } = req.params;
    const dest = path.join(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads'), 'projects', id);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// wrapper to force docType='srs' and check ownership
router.post('/projects/:id/srs', requireRole('partner'), upload.single('file'), async (req, res) => {
  try {
    req.body.docType = 'srs';
    // ensure project belongs to this partner
    // Minimal inline check to avoid circular import
    const { default: Project } = await import('../models/Project.js');
    const project = await Project.findById(req.params.id);
    if (!project || project.partnerId !== req.user.id) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Project not found' });
    }
    return uploadProjectDocument(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;


