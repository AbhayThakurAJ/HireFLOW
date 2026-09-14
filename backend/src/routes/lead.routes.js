import express from 'express';
import { getLeads, getLeadById, createLead, updateLead, deleteLead } from '../controllers/lead.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate); // Protect all lead routes

router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLeadById)
  .patch(updateLead)
  .delete(deleteLead);

export default router;
