import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getTasks, getTask, createTask, updateTask, deleteTask } from '../controllers/task.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
