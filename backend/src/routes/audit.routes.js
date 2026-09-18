import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/', getAuditLogs);

export default router;
