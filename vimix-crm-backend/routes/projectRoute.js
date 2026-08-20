import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStage,
  getProjectDetails,
  uploadProjectDocument,
  deleteProjectDocument,
  addProjectMeeting
} from '../controllers/projectController.js';
import { requireRole } from '../middleware/verifyPartner.js';

const router = express.Router();

// Multer storage setup (keep as-is)
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

// Apply middleware per route: only admins & partners can access
router.post('/', requireRole('admin', 'partner'), createProject);
router.get('/', requireRole('admin', 'partner'), getAllProjects);
router.get('/:id', requireRole('admin', 'partner'), getProjectById);
router.get('/:id/details', requireRole('admin', 'partner'), getProjectDetails);
router.put('/:id/stage', requireRole('admin', 'partner'), updateProjectStage);
router.put('/:id', requireRole('admin', 'partner'), updateProject);
router.delete('/:id', requireRole('admin', 'partner'), deleteProject);

// Documents
router.post('/:id/documents', requireRole('admin', 'partner'), upload.single('file'), uploadProjectDocument);
router.delete('/:id/documents/:docType', requireRole('admin', 'partner'), deleteProjectDocument);

// Meetings
router.post('/:id/meetings', requireRole('admin', 'partner'), addProjectMeeting);

export default router;
