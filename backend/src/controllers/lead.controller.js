import prisma from '../utils/prisma.js';
import { z } from 'zod';
import { calculateLeadScore } from '../services/scoring.service.js';

// Validation Schemas
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  source: z.enum(['WEBSITE', 'LINKEDIN', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL', 'OTHER']).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
});

export const getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status;
    const assignedTo = req.query.assignedTo;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;
    
    // Standard sales rep restriction: only see assigned leads if not ADMIN/MANAGER
    if (req.user.role === 'SALES_REP') {
      where.assignedTo = req.user.id;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json({
      success: true,
      data: leads,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        notesList: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { firstName: true, lastName: true } } }
        }
      },
    });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Auth check: SALES_REP can only view their own leads
    if (req.user.role === 'SALES_REP' && lead.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied to this lead' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createLead = async (req, res) => {
  try {
    const data = leadSchema.parse(req.body);
    
    // Auto-calculate score based on initial data
    const score = calculateLeadScore(data);

    const lead = await prisma.lead.create({
      data: {
        ...data,
        score,
        // If SALES_REP creates a lead, automatically assign it to them
        assignedTo: req.user.role === 'SALES_REP' ? req.user.id : data.assignedTo,
      },
    });

    await prisma.auditLog.create({
      data: { action: 'CREATE', entityType: 'Lead', entityId: lead.id, userId: req.user.id }
    });

    res.status(201).json({ success: true, data: lead, message: 'Lead created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }
    console.error('Error creating lead:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const data = leadSchema.partial().parse(req.body);

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role === 'SALES_REP' && existingLead.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: Cannot edit this lead' });
    }

    // Recalculate score combining old data with new data
    const mergedData = { ...existingLead, ...data };
    const newScore = calculateLeadScore(mergedData);

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { ...data, score: newScore },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Check what changed for specific activities/audit logs
    if (data.status && data.status !== existingLead.status) {
      await prisma.activity.create({
        data: {
          type: 'STATUS_CHANGE',
          content: `Status changed from ${existingLead.status} to ${data.status}`,
          leadId: id,
          userId: req.user.id,
        }
      });
      await prisma.auditLog.create({
        data: { action: 'STATUS_CHANGE', entityType: 'Lead', entityId: id, userId: req.user.id, oldValue: existingLead.status, newValue: data.status }
      });
    }

    if (data.assignedTo !== undefined && data.assignedTo !== existingLead.assignedTo) {
      await prisma.auditLog.create({
        data: { action: 'ASSIGN', entityType: 'Lead', entityId: id, userId: req.user.id, oldValue: existingLead.assignedTo || 'Unassigned', newValue: data.assignedTo || 'Unassigned' }
      });
      
      if (data.assignedTo) {
        await prisma.notification.create({
          data: {
            title: 'New Lead Assigned',
            message: `You have been assigned a new lead: ${mergedData.firstName} ${mergedData.lastName}`,
            userId: data.assignedTo,
            link: `/leads/${id}`
          }
        });
      }
    }

    await prisma.auditLog.create({
      data: { action: 'UPDATE', entityType: 'Lead', entityId: id, userId: req.user.id }
    });

    res.json({ success: true, data: updatedLead, message: 'Lead updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    }
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Only Admin or Manager can delete leads
    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ success: false, message: 'Forbidden: Sales Reps cannot delete leads' });
    }

    await prisma.lead.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { action: 'DELETE', entityType: 'Lead', entityId: id, userId: req.user.id }
    });

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
