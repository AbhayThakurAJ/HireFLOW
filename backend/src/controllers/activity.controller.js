import prisma from '../utils/prisma.js';
import { z } from 'zod';

const activitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'STATUS_CHANGE']),
  content: z.string().min(1, 'Content is required'),
  leadId: z.string().uuid().optional().nullable().or(z.literal('')),
  dealId: z.string().uuid().optional().nullable().or(z.literal('')),
  companyId: z.string().uuid().optional().nullable().or(z.literal('')),
  contactId: z.string().uuid().optional().nullable().or(z.literal('')),
});


export const getActivities = async (req, res) => {
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

    
    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
};

export const createActivity = async (req, res) => {
  try {
    const validatedData = activitySchema.parse(req.body);
    
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

    
    // Authorization: anyone authenticated can create an activity, but we could add checks
    
    const activity = await prisma.$transaction(async (tx) => {
      const newActivity = await tx.activity.create({
        data: {
          ...validatedData,
          userId: req.user.id
        }
      });
      
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'ACTIVITY',
          entityId: newActivity.id,
          userId: req.user.id
        }
      });
      
      return newActivity;
    });
    
    // Fetch with user included to return complete object
    const completeActivity = await prisma.activity.findUnique({
      where: { id: activity.id },
      include: { user: { select: { id: true, firstName: true, lastName: true } } }
    });
    
    res.status(201).json({ success: true, data: completeActivity });
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error && error.code === 'P2003') {
      return res.status(400).json({ success: false, error: 'Invalid reference to a nonexistent entity' });
    }
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    res.status(500).json({ success: false, error: 'Failed to create activity' });
  }
};
