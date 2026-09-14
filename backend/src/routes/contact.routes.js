import express from 'express';
import { getContacts, getContactById, createContact, updateContact, deleteContact } from '../controllers/contact.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.route('/')
  .get(getContacts)
  .post(createContact);

router.route('/:id')
  .get(getContactById)
  .patch(updateContact)
  .delete(deleteContact);

export default router;
