import prisma from '../utils/prisma.js';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  size: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

export const getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 20;
    if (limit > 100) limit = 100;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    } : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { contacts: true, leads: true, deals: true }
          }
        }
      }),
      prisma.company.count({ where }),
    ]);

    res.json({
      success: true,
      data: companies,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignedFilter = req.user.role === 'SALES_REP' ? { assignedTo: req.user.id } : {};
    
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { firstName: 'asc' } },
        leads: {
          where: assignedFilter,
          orderBy: { createdAt: 'desc' },
          include: { assignee: { select: { firstName: true, lastName: true } } }
        },
        deals: {
          where: assignedFilter,
          orderBy: { createdAt: 'desc' },
          include: { assignee: { select: { firstName: true, lastName: true } } }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { firstName: true, lastName: true } } }
        }
      }
    });


    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createCompany = async (req, res) => {
  try {
    const data = companySchema.parse(req.body);
    const company = await prisma.company.create({ data });
    
    await prisma.auditLog.create({
      data: { action: 'CREATE', entityType: 'Company', entityId: company.id, userId: req.user.id }
    });

    res.status(201).json({ success: true, data: company, message: 'Company created' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const data = companySchema.partial().parse(req.body);
    
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });

    const company = await prisma.company.update({ where: { id }, data });
    
    await prisma.auditLog.create({
      data: { action: 'UPDATE', entityType: 'Company', entityId: id, userId: req.user.id }
    });

    res.json({ success: true, data: company, message: 'Company updated' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Company not found' });

    await prisma.company.delete({ where: { id } });
    
    await prisma.auditLog.create({
      data: { action: 'DELETE', entityType: 'Company', entityId: id, userId: req.user.id }
    });

    res.json({ success: true, message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
