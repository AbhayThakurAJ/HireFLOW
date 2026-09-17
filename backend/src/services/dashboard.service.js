import prisma from '../utils/prisma.js';

function buildDateFilter(from, to) {
  if (!from && !to) return undefined;
  const dateFilter = {};
  if (from) {
    const d = new Date(from);
    if (isNaN(d.getTime())) throw new Error('Invalid from date');
    dateFilter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (isNaN(d.getTime())) throw new Error('Invalid to date');
    dateFilter.lte = d;
  }
  return dateFilter;
}

function buildAssignedFilter(role, userId) {
  if (role === 'SALES_REP') {
    return { assignedTo: userId };
  }
  return {};
}

export const getDashboardKPIs = async (user, from, to) => {
  const dateFilter = buildDateFilter(from, to);
  const assignedFilter = buildAssignedFilter(user.role, user.id);

  const leadWhere = { ...assignedFilter };
  if (dateFilter) leadWhere.createdAt = dateFilter;

  const dealWhere = { ...assignedFilter };
  if (dateFilter) dealWhere.createdAt = dateFilter;

  // Companies & Contacts don't have assignedTo
  const companyWhere = {};
  if (dateFilter) companyWhere.createdAt = dateFilter;

  const contactWhere = {};
  if (dateFilter) contactWhere.createdAt = dateFilter;

  const taskWhere = { ...assignedFilter, status: { not: 'COMPLETED' }, dueDate: { lt: new Date() } };
  if (dateFilter) taskWhere.createdAt = dateFilter; // overdue logic usually independent of created, but if filtering by date... let's just leave it as all overdue

  const [
    totalLeads,
    qualifiedLeads,
    totalCompanies,
    totalContacts,
    openDealsCount,
    wonDealsCount,
    lostDealsCount,
    pipelineValueAgg,
    wonRevenueAgg,
    lostValueAgg,
    overdueTasks
  ] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({ where: { ...leadWhere, status: 'QUALIFIED' } }),
    prisma.company.count({ where: companyWhere }),
    prisma.contact.count({ where: contactWhere }),
    prisma.deal.count({ where: { ...dealWhere, stage: { notIn: ['WON', 'LOST'] } } }),
    prisma.deal.count({ where: { ...dealWhere, stage: 'WON' } }),
    prisma.deal.count({ where: { ...dealWhere, stage: 'LOST' } }),
    prisma.deal.aggregate({ _sum: { value: true }, where: { ...dealWhere, stage: { notIn: ['WON', 'LOST'] } } }),
    prisma.deal.aggregate({ _sum: { value: true }, where: { ...dealWhere, stage: 'WON' } }),
    prisma.deal.aggregate({ _sum: { value: true }, where: { ...dealWhere, stage: 'LOST' } }),
    prisma.task.count({ where: taskWhere })
  ]);

  const pipelineValue = pipelineValueAgg._sum.value || 0;
  const wonRevenue = wonRevenueAgg._sum.value || 0;
  const lostDealValue = lostValueAgg._sum.value || 0;

  const totalClosedDeals = wonDealsCount + lostDealsCount;
  const conversionRate = totalClosedDeals > 0 ? (wonDealsCount / totalClosedDeals) * 100 : 0;

  return {
    totalLeads,
    qualifiedLeads,
    totalCompanies,
    totalContacts,
    openDeals: openDealsCount,
    pipelineValue,
    wonRevenue,
    lostDealValue,
    conversionRate,
    overdueTasks
  };
};

export const getPipelineAnalytics = async (user, from, to) => {
  const dateFilter = buildDateFilter(from, to);
  const assignedFilter = buildAssignedFilter(user.role, user.id);

  const where = { ...assignedFilter };
  if (dateFilter) where.createdAt = dateFilter;

  const grouped = await prisma.deal.groupBy({
    by: ['stage'],
    _count: { id: true },
    _sum: { value: true },
    _avg: { value: true },
    where
  });

  const stages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
  return stages.map(stage => {
    const data = grouped.find(g => g.stage === stage);
    return {
      stage,
      count: data?._count?.id || 0,
      totalValue: data?._sum?.value || 0,
      avgValue: data?._avg?.value || 0
    };
  });
};

export const getRevenueAnalytics = async (user, from, to) => {
  const dateFilter = buildDateFilter(from, to);
  const assignedFilter = buildAssignedFilter(user.role, user.id);

  const where = { ...assignedFilter, stage: 'WON' };
  if (dateFilter) where.createdAt = dateFilter; // Wait, usually we use expectedCloseDate or updatedAt for revenue date, let's use updatedAt for won deals

  if (dateFilter) {
    where.updatedAt = dateFilter;
    delete where.createdAt;
  }

  // Grouping by date in Prisma is a bit tricky, but we can fetch them and group by Day/Month depending on range.
  // To avoid fetching everything, if it's huge, but since we are in SQLite/Postgres without raw query capability easily via Prisma grouped by day, we fetch `updatedAt` and `value`.
  const deals = await prisma.deal.findMany({
    where,
    select: { updatedAt: true, value: true },
    orderBy: { updatedAt: 'asc' }
  });

  // Group by day (YYYY-MM-DD)
  const revenueByDay = {};
  for (const deal of deals) {
    const day = deal.updatedAt.toISOString().split('T')[0];
    revenueByDay[day] = (revenueByDay[day] || 0) + deal.value;
  }

  return Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));
};

export const getLeadAnalytics = async (user, from, to) => {
  const dateFilter = buildDateFilter(from, to);
  const assignedFilter = buildAssignedFilter(user.role, user.id);

  const where = { ...assignedFilter };
  if (dateFilter) where.createdAt = dateFilter;

  const [bySource, byStatus] = await Promise.all([
    prisma.lead.groupBy({ by: ['source'], _count: { id: true }, where }),
    prisma.lead.groupBy({ by: ['status'], _count: { id: true }, where })
  ]);

  const sourceData = bySource.map(s => ({ source: s.source, count: s._count.id }));
  const statusData = byStatus.map(s => ({ status: s.status, count: s._count.id }));

  const totalLeads = statusData.reduce((acc, curr) => acc + curr.count, 0);
  const converted = statusData.find(s => s.status === 'CONVERTED')?.count || 0;
  const lost = statusData.find(s => s.status === 'LOST')?.count || 0;
  const qualified = statusData.find(s => s.status === 'QUALIFIED')?.count || 0;

  const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

  return {
    bySource: sourceData,
    byStatus: statusData,
    metrics: {
      total: totalLeads,
      qualified,
      converted,
      lost,
      conversionRate
    }
  };
};

export const getPerformanceAnalytics = async (user, from, to) => {
  const dateFilter = buildDateFilter(from, to);
  
  // Only ADMIN and MANAGER should see performance of multiple reps.
  // SALES_REP should only see their own.
  const usersWhere = {};
  if (user.role === 'SALES_REP') {
    usersWhere.id = user.id;
  } else if (user.role === 'MANAGER') {
    // If managers had teams, we'd filter by team. For now, manager sees all reps or their team. We'll show all SALES_REPs.
    usersWhere.role = 'SALES_REP';
  }

  const users = await prisma.user.findMany({
    where: usersWhere,
    select: { id: true, firstName: true, lastName: true, role: true }
  });

  const leadWhere = {}; if (dateFilter) leadWhere.createdAt = dateFilter;
  const dealWhere = {}; if (dateFilter) dealWhere.createdAt = dateFilter;

  const results = [];
  for (const u of users) {
    const assignedFilter = { assignedTo: u.id };
    
    const [
      assignedLeads,
      convertedLeads,
      assignedDeals,
      wonDeals,
      lostDeals,
      wonRevenueAgg,
      pipelineValueAgg
    ] = await Promise.all([
      prisma.lead.count({ where: { ...leadWhere, ...assignedFilter } }),
      prisma.lead.count({ where: { ...leadWhere, ...assignedFilter, status: 'CONVERTED' } }),
      prisma.deal.count({ where: { ...dealWhere, ...assignedFilter } }),
      prisma.deal.count({ where: { ...dealWhere, ...assignedFilter, stage: 'WON' } }),
      prisma.deal.count({ where: { ...dealWhere, ...assignedFilter, stage: 'LOST' } }),
      prisma.deal.aggregate({ _sum: { value: true }, where: { ...dealWhere, ...assignedFilter, stage: 'WON' } }),
      prisma.deal.aggregate({ _sum: { value: true }, where: { ...dealWhere, ...assignedFilter, stage: { notIn: ['WON', 'LOST'] } } })
    ]);

    results.push({
      userId: u.id,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      assignedLeads,
      convertedLeads,
      assignedDeals,
      wonDeals,
      lostDeals,
      wonRevenue: wonRevenueAgg._sum.value || 0,
      pipelineValue: pipelineValueAgg._sum.value || 0
    });
  }

  return results;
};
