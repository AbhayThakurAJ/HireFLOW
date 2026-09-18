import express from 'express';
import multer from 'multer';
import { importLeads } from '../controllers/import.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const router = express.Router();

router.use(authenticate);
router.post('/leads', upload.single('file'), importLeads);

export default router;
