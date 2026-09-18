import express from 'express';
import * as exportController from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);
router.get('/leads', exportController.exportLeads);
router.get('/contacts', exportController.exportContacts);
router.get('/companies', exportController.exportCompanies);
router.get('/deals', exportController.exportDeals);

export default router;
