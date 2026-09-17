import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getActivities, createActivity } from '../controllers/activity.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getActivities);
router.post('/', createActivity);

export default router;
