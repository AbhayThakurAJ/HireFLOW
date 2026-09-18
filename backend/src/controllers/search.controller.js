import prisma from '../utils/prisma.js';

export const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, data: { leads: [], contacts: [], companies: [], deals: [] } });
    }

    const search = q.trim();
    const assignedFilter = req.user.role === 'SALES_REP' ? { assignedTo: req.user.id } : {};

    const [leads, contacts, companies, deals] = await Promise.all([
      prisma.lead.findMany({
        where: {
          ...assignedFilter,
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { company: { contains: search, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true }
      }),
      prisma.contact.findMany({
        where: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true, company: { select: { name: true } } }
      }),
      prisma.company.findMany({
        where: {
          name: { contains: search, mode: 'insensitive' }
        },
        take: 5,
        select: { id: true, name: true, industry: true }
      }),
      prisma.deal.findMany({
        where: {
          ...assignedFilter,
          title: { contains: search, mode: 'insensitive' }
        },
        take: 5,
        select: { id: true, title: true, value: true, stage: true }
      })
    ]);

    res.json({ success: true, data: { leads, contacts, companies, deals } });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
};
