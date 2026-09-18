import prisma from '../utils/prisma.js';
import { z } from 'zod';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  companyId: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
});

export const getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100;
    const search = req.query.search || '';
    const companyId = req.query.companyId;

    const skip = (page - 1) * limit;
    const where = {};
    if (companyId) where.companyId = companyId;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
        include: { company: { select: { id: true, name: true } } }
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      success: true,
      data: contacts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignedFilter = req.user.role === 'SALES_REP' ? { assignedTo: req.user.id } : {};
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        company: true,
        deals: {
          where: assignedFilter,
          orderBy: { createdAt: 'desc' },
          include: { assignee: { select: { firstName: true, lastName: true } } }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        notesList: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { firstName: true, lastName: true } } }
        }
      }
    });


    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createContact = async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);
    const contact = await prisma.contact.create({ data });
    
    await prisma.auditLog.create({
      data: { action: 'CREATE', entityType: 'Contact', entityId: contact.id, userId: req.user.id }
    });

    res.status(201).json({ success: true, data: contact, message: 'Contact created' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const data = contactSchema.partial().parse(req.body);
    
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Contact not found' });

    const contact = await prisma.contact.update({ where: { id }, data, include: { company: { select: { name: true } } } });
    
    await prisma.auditLog.create({
      data: { action: 'UPDATE', entityType: 'Contact', entityId: id, userId: req.user.id }
    });

    res.json({ success: true, data: contact, message: 'Contact updated' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Contact not found' });

    await prisma.contact.delete({ where: { id } });
    
    await prisma.auditLog.create({
      data: { action: 'DELETE', entityType: 'Contact', entityId: id, userId: req.user.id }
    });

    res.json({ success: true, message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
