import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/stats', dashboardController.getKPIs);
router.get('/pipeline', dashboardController.getPipeline);
router.get('/revenue', dashboardController.getRevenue);
router.get('/leads', dashboardController.getLeads);
router.get('/performance', dashboardController.getPerformance);

export default router;
