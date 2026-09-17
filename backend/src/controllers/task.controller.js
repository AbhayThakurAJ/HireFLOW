import prisma from '../utils/prisma.js';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().nullable().or(z.literal('')),
  dueDate: z.string().datetime().optional().nullable().or(z.literal('')),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).default('TODO'),
  assignedTo: z.string().uuid('Invalid user ID').optional().nullable().or(z.literal('')),
  leadId: z.string().uuid('Invalid lead ID').optional().nullable().or(z.literal('')),
  dealId: z.string().uuid('Invalid deal ID').optional().nullable().or(z.literal('')),
});

const taskUpdateSchema = taskSchema.partial();

export const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const priority = req.query.priority || '';
    const assignedTo = req.query.assignedTo || '';
    const leadId = req.query.leadId || '';
    const dealId = req.query.dealId || '';
    
    const skip = (page - 1) * limit;
    const where = {};
    
    if (req.user.role === 'SALES_REP') {
      where.assignedTo = req.user.id;
    } else if (assignedTo) {
      where.assignedTo = assignedTo;
    }
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (leadId) where.leadId = leadId;
    if (dealId) where.dealId = dealId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, title: true } }
        }
      }),
      prisma.task.count({ where })
    ]);
    
    res.json({
      success: true,
      data: tasks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tasks' });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, title: true } }
      }
    });
    
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (req.user.role === 'SALES_REP' && task.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch task' });
  }
};

export const createTask = async (req, res) => {
  try {
    const validatedData = taskSchema.parse(req.body);
    
    if (validatedData.leadId === '') validatedData.leadId = null;
    if (validatedData.dealId === '') validatedData.dealId = null;
    if (validatedData.assignedTo === '') validatedData.assignedTo = null;
    if (validatedData.dueDate === '') validatedData.dueDate = null;
    
    if (req.user.role === 'SALES_REP') {
      validatedData.assignedTo = req.user.id;
    }
    
    if (validatedData.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: validatedData.leadId } });
      if (!lead) return res.status(400).json({ success: false, error: 'Invalid lead ID' });
      if (req.user.role === 'SALES_REP' && lead.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized to link to this lead' });
    }
    if (validatedData.dealId) {
      const deal = await prisma.deal.findUnique({ where: { id: validatedData.dealId } });
      if (!deal) return res.status(400).json({ success: false, error: 'Invalid deal ID' });
      if (req.user.role === 'SALES_REP' && deal.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized to link to this deal' });
    }
    if (validatedData.assignedTo) {
      const user = await prisma.user.findUnique({ where: { id: validatedData.assignedTo } });
      if (!user) return res.status(400).json({ success: false, error: 'Invalid assigned user ID' });
    }
    
    const task = await prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({ data: validatedData });
      
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'TASK',
          entityId: newTask.id,
          userId: req.user.id
        }
      });
      
      await tx.activity.create({
        data: {
          type: 'TASK',
          content: `Task created: ${newTask.title}`,
          userId: req.user.id,
          leadId: newTask.leadId,
          dealId: newTask.dealId
        }
      });
      
      return newTask;
    });
    
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('Error creating task:', error);
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = taskUpdateSchema.parse(req.body);
    
    if (validatedData.leadId === '') validatedData.leadId = null;
    if (validatedData.dealId === '') validatedData.dealId = null;
    if (validatedData.assignedTo === '') validatedData.assignedTo = null;
    if (validatedData.dueDate === '') validatedData.dueDate = null;
    
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) return res.status(404).json({ success: false, error: 'Task not found' });
    
    if (req.user.role === 'SALES_REP' && existingTask.assignedTo !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to update this task' });
    }
    
    if (req.user.role === 'SALES_REP' && validatedData.assignedTo !== undefined) {
      delete validatedData.assignedTo;
    }
    
    if (validatedData.leadId && validatedData.leadId !== existingTask.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: validatedData.leadId } });
      if (!lead) return res.status(400).json({ success: false, error: 'Invalid lead ID' });
      if (req.user.role === 'SALES_REP' && lead.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized to link to this lead' });
    }
    if (validatedData.dealId && validatedData.dealId !== existingTask.dealId) {
      const deal = await prisma.deal.findUnique({ where: { id: validatedData.dealId } });
      if (!deal) return res.status(400).json({ success: false, error: 'Invalid deal ID' });
      if (req.user.role === 'SALES_REP' && deal.assignedTo !== req.user.id) return res.status(403).json({ success: false, error: 'Unauthorized to link to this deal' });
    }
    if (validatedData.assignedTo && validatedData.assignedTo !== existingTask.assignedTo) {
      const user = await prisma.user.findUnique({ where: { id: validatedData.assignedTo } });
      if (!user) return res.status(400).json({ success: false, error: 'Invalid assigned user ID' });
    }
    
    const task = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: validatedData
      });
      
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'TASK',
          entityId: id,
          userId: req.user.id
        }
      });
      
      if (validatedData.status && validatedData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
        await tx.activity.create({
          data: {
            type: 'TASK',
            content: `Task completed: ${updated.title}`,
            userId: req.user.id,
            leadId: updated.leadId,
            dealId: updated.dealId
          }
        });
      }
      
      return updated;
    });
    
    res.json({ success: true, data: task });
  } catch (error) {
    console.error('Error updating task:', error);
    if (error && error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors?.[0]?.message || 'Validation failed' });
    }
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTask = await prisma.task.findUnique({ where: { id } });
    
    if (!existingTask) return res.status(404).json({ success: false, error: 'Task not found' });
    
    if (req.user.role === 'SALES_REP') {
      return res.status(403).json({ success: false, error: 'Sales reps cannot delete tasks' });
    }
    
    await prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          action: 'DELETE',
          entityType: 'TASK',
          entityId: id,
          userId: req.user.id
        }
      });
    });
    
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
};
