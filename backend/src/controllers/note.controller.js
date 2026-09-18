import prisma from '../utils/prisma.js';
import { z } from 'zod';

const noteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  leadId: z.string().uuid().optional().nullable().or(z.literal('')),
  dealId: z.string().uuid().optional().nullable().or(z.literal('')),
  companyId: z.string().uuid().optional().nullable().or(z.literal('')),
  contactId: z.string().uuid().optional().nullable().or(z.literal('')),
});

const noteUpdateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});


export const getNotes = async (req, res) => {
  try {
    const { leadId, dealId, companyId, contactId } = req.query;
    
    if (req.user.role === 'SALES_REP') {
      if (leadId) {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (!lead || lead.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized' });
      }
      if (dealId) {
        const deal = await prisma.deal.findUnique({ where: { id: dealId } });
        if (!deal || deal.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized' });
      }
    }

    const where = {};
    if (leadId) where.leadId = leadId;
    if (dealId) where.dealId = dealId;
    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;

    
    const notes = await prisma.note.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notes' });
  }
};

export const createNote = async (req, res) => {
  try {
    const validatedData = noteSchema.parse(req.body);
    
    if (validatedData.leadId === '') validatedData.leadId = null;
    if (validatedData.dealId === '') validatedData.dealId = null;
    if (validatedData.companyId === '') validatedData.companyId = null;
    if (validatedData.contactId === '') validatedData.contactId = null;

    if (req.user.role === 'SALES_REP') {
      if (validatedData.leadId) {
        const lead = await prisma.lead.findUnique({ where: { id: validatedData.leadId } });
        if (!lead || lead.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized lead' });
      }
      if (validatedData.dealId) {
        const deal = await prisma.deal.findUnique({ where: { id: validatedData.dealId } });
        if (!deal || deal.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized deal' });
      }
    }

    
    const note = await prisma.$transaction(async (tx) => {
      const newNote = await tx.note.create({
        data: {
          ...validatedData,
          authorId: req.user.id
        }
      });
      
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'NOTE',
          entityId: newNote.id,
          userId: req.user.id
        }
      });
      
      return newNote;
    });
    
    const completeNote = await prisma.note.findUnique({
      where: { id: note.id },
      include: { author: { select: { id: true, firstName: true, lastName: true } } }
    });
    
    res.status(201).json({ success: true, data: completeNote });
  } catch (error) {
    console.error('Error creating note:', error);
    if (error && error.code === 'P2003') {
      return res.status(400).json({ success: false, error: 'Invalid reference to a nonexistent entity' });
    }
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = noteUpdateSchema.parse(req.body);
    
    const existingNote = await prisma.note.findUnique({ where: { id } });
    if (!existingNote) return res.status(404).json({ success: false, error: 'Note not found' });
    
    if (existingNote.authorId !== req.user.id && req.user.role === 'SALES_REP') {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this note' });
    }
    
    const updatedNote = await prisma.$transaction(async (tx) => {
      const updated = await tx.note.update({
        where: { id },
        data: validatedData
      });
      
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'NOTE',
          entityId: id,
          userId: req.user.id
        }
      });
      
      return updated;
    });
    
    const completeNote = await prisma.note.findUnique({
      where: { id: updatedNote.id },
      include: { author: { select: { id: true, firstName: true, lastName: true } } }
    });
    
    res.json({ success: true, data: completeNote });
  } catch (error) {
    console.error('Error updating note:', error);
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    res.status(500).json({ success: false, error: 'Failed to update note' });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const existingNote = await prisma.note.findUnique({ where: { id } });
    
    if (!existingNote) return res.status(404).json({ success: false, error: 'Note not found' });
    
    if (existingNote.authorId !== req.user.id && req.user.role === 'SALES_REP') {
      return res.status(403).json({ success: false, error: 'Unauthorized to delete this note' });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.note.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'NOTE',
          entityId: id,
          userId: req.user.id
        }
      });
    });
    
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ success: false, error: 'Failed to delete note' });
  }
};
