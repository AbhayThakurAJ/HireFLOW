import prisma from '../utils/prisma.js';

export const getAuditLogs = async (req, res) => {
  try {
    // Only ADMIN (or MANAGER if requested, but instructions say ADMIN unless specified otherwise. 'Only ADMIN should be able to access the complete audit log interface unless the existing requirements explicitly define otherwise.')
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Access denied. Audit logs require ADMIN.' });
    }

    let { page = 1, limit = 50, action, entityType, userId, from, to } = req.query;
    limit = Math.min(Number(limit), 100);
    
    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;
    
    if (from || to) {
      where.timestamp = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) where.timestamp.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) where.timestamp.lte = d;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { user: { select: { firstName: true, lastName: true, email: true } } }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ success: true, data: { logs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    console.error('Audit logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
};
