import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getNotes, createNote, updateNote, deleteNote } from '../controllers/note.controller.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getNotes);
router.post('/', createNote);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
