import prisma from '../utils/prisma.js';
import { z } from 'zod';

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(0, 'Value must be positive'),
  currency: z.string().default('USD'),
  stage: z.enum(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('NEW'),
  probability: z.number().int().min(0).max(100).default(0),
  expectedCloseDate: z.string().datetime().optional().nullable().or(z.literal('')),
  companyId: z.string().uuid('Invalid company ID').optional().nullable().or(z.literal('')),
  contactId: z.string().uuid('Invalid contact ID').optional().nullable().or(z.literal('')),
  assignedTo: z.string().uuid('Invalid user ID').optional().nullable().or(z.literal('')),
  description: z.string().optional().nullable().or(z.literal('')),
});

const updateDealSchema = dealSchema.partial();

const dealStageUpdateSchema = z.object({
  stage: z.enum(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'])
});

export const getDeals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const stage = req.query.stage || '';
    const assignedTo = req.query.assignedTo || '';
    
    const skip = (page - 1) * limit;

    const where = {};
    
    // RBAC: SALES_REP only sees assigned deals
    if (req.user.role === 'SALES_REP') {
      where.assignedTo = req.user.id;
    } else if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (stage) {
      where.stage = stage;
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    res.json({
      success: true,
      data: deals,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deals' });
  }
};

export const getDeal = async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        company: true,
        contact: true,
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        activities: { orderBy: { createdAt: 'desc' }, include: { user: { select: { firstName: true, lastName: true } } } },
        tasks: { orderBy: { dueDate: 'asc' } },
        notesList: { orderBy: { createdAt: 'desc' }, include: { author: { select: { firstName: true, lastName: true } } } },
      },
    });

    if (!deal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && deal.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to access this deal' });
    }

    res.json({ success: true, data: deal });
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deal' });
  }
};

export const createDeal = async (req, res) => {
  try {
    const validatedData = dealSchema.parse(req.body);
    
    // Normalize optional relationships
    if (!validatedData.companyId) validatedData.companyId = null;
    if (!validatedData.contactId) validatedData.contactId = null;
    if (!validatedData.assignedTo) validatedData.assignedTo = null;
    if (!validatedData.expectedCloseDate) validatedData.expectedCloseDate = null;
    if (!validatedData.description) validatedData.description = null;

    // Validate foreign keys if provided
    if (validatedData.companyId) {
      const company = await prisma.company.findUnique({ where: { id: validatedData.companyId } });
      if (!company) return res.status(400).json({ success: false, error: 'Invalid company ID' });
    }
    if (validatedData.contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: validatedData.contactId } });
      if (!contact) return res.status(400).json({ success: false, error: 'Invalid contact ID' });
    }
    if (validatedData.assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: validatedData.assignedTo } });
      if (!assignee) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Set default assignment for SALES_REP
    if (req.user.role === 'SALES_REP') {
      validatedData.assignedTo = req.user.id;
    }

    const deal = await prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: validatedData,
      });

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'DEAL',
          entityId: newDeal.id,
          userId: req.user.id
        },
      });

      await tx.activity.create({
        data: {
          type: 'NOTE',
          content: `Deal Created and moved to ${newDeal.stage} stage`,
          userId: req.user.id,
          dealId: newDeal.id,
        }
      });

      return newDeal;
    });

    res.status(201).json({ success: true, data: deal });
  } catch (error) {
    console.error('Error creating deal:', error);
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create deal' });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateDealSchema.parse(req.body);

    // Normalize optional relationships
    if (validatedData.companyId === '') validatedData.companyId = null;
    if (validatedData.contactId === '') validatedData.contactId = null;
    if (validatedData.assignedTo === '') validatedData.assignedTo = null;
    if (validatedData.expectedCloseDate === '') validatedData.expectedCloseDate = null;

    const existingDeal = await prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && existingDeal.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this deal' });
    }
    
    // Validate foreign keys if provided and changed
    if (validatedData.companyId && validatedData.companyId !== existingDeal.companyId) {
      const company = await prisma.company.findUnique({ where: { id: validatedData.companyId } });
      if (!company) return res.status(400).json({ success: false, error: 'Invalid company ID' });
    }
    if (validatedData.contactId && validatedData.contactId !== existingDeal.contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: validatedData.contactId } });
      if (!contact) return res.status(400).json({ success: false, error: 'Invalid contact ID' });
    }
    if (validatedData.assignedTo && validatedData.assignedTo !== existingDeal.assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: validatedData.assignedTo } });
      if (!assignee) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const deal = await prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: validatedData,
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'DEAL',
          entityId: id,
          userId: req.user.id
        },
      });
      
      if (validatedData.stage && validatedData.stage !== existingDeal.stage) {
        await tx.activity.create({
          data: {
            type: 'NOTE',
            content: `Deal stage changed from ${existingDeal.stage} to ${validatedData.stage}`,
            userId: req.user.id,
            dealId: id,
          }
        });
      }

      return updated;
    });

    res.json({ success: true, data: deal });
  } catch (error) {
    console.error('Error updating deal:', error);
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    return res.status(500).json({ success: false, error: 'Failed to update deal' });
  }
};

export const updateDealStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = dealStageUpdateSchema.parse(req.body);
    
    const existingDeal = await prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    if (req.user.role === 'SALES_REP' && existingDeal.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this deal' });
    }

    const deal = await prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: { stage },
      });

      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'DEAL',
          entityId: id,
          userId: req.user.id
        },
      });
      
      await tx.activity.create({
        data: {
          type: 'NOTE',
          content: `Deal stage changed from ${existingDeal.stage} to ${stage}`,
          userId: req.user.id,
          dealId: id,
        }
      });

      return updated;
    });

    res.json({ success: true, data: deal });
  } catch (error) {
    console.error('Error updating deal stage:', error);
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    return res.status(500).json({ success: false, error: 'Failed to update deal stage' });
  }
}

export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ success: false, error: 'Sales representatives cannot delete deals' });
    }

    const existingDeal = await prisma.deal.findUnique({ where: { id } });
    if (!existingDeal) {
      return res.status(404).json({ success: false, error: 'Deal not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.deal.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'DEAL',
          entityId: id,
          userId: req.user.id
        },
      });
    });

    res.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ success: false, error: 'Failed to delete deal' });
  }
};
