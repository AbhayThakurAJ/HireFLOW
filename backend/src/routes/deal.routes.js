import express from 'express';
import { getDeals, getDeal, createDeal, updateDeal, updateDealStage, deleteDeal } from '../controllers/deal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDeals);
router.post('/', createDeal);
router.get('/:id', getDeal);
router.patch('/:id', updateDeal);
router.patch('/:id/stage', updateDealStage);
router.delete('/:id', deleteDeal);

export default router;
