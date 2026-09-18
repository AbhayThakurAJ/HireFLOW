import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  useDashboardKPIs, 
  useDashboardPipeline, 
  useDashboardRevenue, 
  useDashboardLeads, 
  useDashboardPerformance 
} from '../hooks/useDashboard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, Building, Briefcase, DollarSign, Target, CheckCircle2, 
  AlertCircle, TrendingUp, Calendar as CalendarIcon, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, subDays, startOfMonth, startOfYear, subMonths } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function DateRangeSelector({ value, onChange }) {
  const options = [
    { label: 'All Time', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'This Year', value: 'thisYear' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <CalendarIcon className="h-5 w-5 text-gray-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function getDateRangeParams(range) {
  const now = new Date();
  switch (range) {
    case 'today':
      return { from: new Date(now.setHours(0,0,0,0)).toISOString(), to: new Date(now.setHours(23,59,59,999)).toISOString() };
    case '7d':
      return { from: subDays(now, 7).toISOString(), to: now.toISOString() };
    case '30d':
      return { from: subDays(now, 30).toISOString(), to: now.toISOString() };
    case '90d':
      return { from: subDays(now, 90).toISOString(), to: now.toISOString() };
    case 'thisMonth':
      return { from: startOfMonth(new Date()).toISOString(), to: now.toISOString() };
    case 'thisYear':
      return { from: startOfYear(new Date()).toISOString(), to: now.toISOString() };
    default:
      return { from: undefined, to: undefined };
  }
}

function StatCard({ title, value, icon: Icon, link, format = (v) => v, isLoading, isError }) {
  const content = (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${link ? 'hover:shadow-md transition-shadow' : ''}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                {isLoading ? (
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mt-1"></div>
                ) : isError ? (
                  <span className="text-sm text-red-500 mt-1">Error</span>
                ) : (
                  <div className="text-2xl font-semibold text-gray-900 mt-1">{format(value)}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30d');
  
  const dateParams = getDateRangeParams(dateRange);

  const kpiQuery = useDashboardKPIs(dateParams);
  const pipelineQuery = useDashboardPipeline(dateParams);
  const revenueQuery = useDashboardRevenue(dateParams);
  const leadsQuery = useDashboardLeads(dateParams);
  const perfQuery = useDashboardPerformance(dateParams);

  const formatCurrency = (val) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(val || 0);
  const formatPercent = (val) => `${(val || 0).toFixed(1)}%`;
  const formatNumber = (val) => new Intl.NumberFormat('en-US').format(val || 0);

  const kpis = kpiQuery.data?.data || {};
  const isKpiLoading = kpiQuery.isLoading;

  const refreshAll = () => {
    kpiQuery.refetch();
    pipelineQuery.refetch();
    revenueQuery.refetch();
    leadsQuery.refetch();
    perfQuery.refetch();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.firstName}. Here's what's happening.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={refreshAll}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Leads" value={kpis.totalLeads} icon={Users} link="/leads" isLoading={isKpiLoading} format={formatNumber} />
        <StatCard title="Qualified Leads" value={kpis.qualifiedLeads} icon={Target} link="/leads?status=QUALIFIED" isLoading={isKpiLoading} format={formatNumber} />
        <StatCard title="Lead Win Rate" value={kpis.conversionRate} icon={TrendingUp} isLoading={isKpiLoading} format={formatPercent} />
        <StatCard title="Overdue Tasks" value={kpis.overdueTasks} icon={AlertCircle} link="/tasks" isLoading={isKpiLoading} format={formatNumber} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Open Deals" value={kpis.openDeals} icon={Briefcase} link="/deals" isLoading={isKpiLoading} format={formatNumber} />
        <StatCard title="Pipeline Value" value={kpis.pipelineValue} icon={DollarSign} link="/pipeline" isLoading={isKpiLoading} format={formatCurrency} />
        <StatCard title="Won Revenue" value={kpis.wonRevenue} icon={CheckCircle2} isLoading={isKpiLoading} format={formatCurrency} />
        <StatCard title="Lost Deal Value" value={kpis.lostDealValue} icon={AlertCircle} isLoading={isKpiLoading} format={formatCurrency} />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Revenue Over Time */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Won Revenue Over Time</h2>
          {revenueQuery.isLoading ? (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded animate-pulse">Loading chart...</div>
          ) : revenueQuery.data?.data?.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueQuery.data.data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                  <YAxis tickFormatter={(v) => `$${(v/1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')} />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">No revenue data for this period</div>
          )}
        </div>

        {/* Pipeline by Stage */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Pipeline by Stage</h2>
          {pipelineQuery.isLoading ? (
             <div className="h-64 flex items-center justify-center bg-gray-50 rounded animate-pulse">Loading chart...</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineQuery.data?.data} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${(v/1000)}k`} />
                  <YAxis dataKey="stage" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="totalValue" fill="#0EA5E9" name="Pipeline Value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Lead Source */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Sources</h2>
          {leadsQuery.isLoading ? (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded animate-pulse">Loading...</div>
          ) : leadsQuery.data?.data?.bySource?.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsQuery.data.data.bySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="source"
                  >
                    {leadsQuery.data.data.bySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {leadsQuery.data.data.bySource.map((entry, i) => (
                   <span key={entry.source} className="text-xs flex items-center">
                     <span className="w-3 h-3 inline-block rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                     {entry.source} ({entry.count})
                   </span>
                ))}
              </div>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded">No source data</div>
          )}
        </div>

        {/* Lead Status */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Status Distribution</h2>
          {leadsQuery.isLoading ? (
             <div className="h-64 flex items-center justify-center bg-gray-50 rounded animate-pulse">Loading...</div>
          ) : (
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsQuery.data?.data?.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Sales Performance */}
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'SALES_REP') && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Sales Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rep</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Leads</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Converted Leads</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Open Pipeline</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Won Deals</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Won Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {perfQuery.isLoading ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading performance data...</td></tr>
                ) : perfQuery.data?.data?.length > 0 ? (
                  perfQuery.data.data.map((perf) => (
                    <tr key={perf.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{perf.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatNumber(perf.assignedLeads)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatNumber(perf.convertedLeads)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(perf.pipelineValue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatNumber(perf.wonDeals)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">{formatCurrency(perf.wonRevenue)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No performance data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
