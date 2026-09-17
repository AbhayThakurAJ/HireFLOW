import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const buildQueryParams = (params) => {
  const urlParams = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null)));
  const query = urlParams.toString();
  return query ? `?${query}` : '';
};

export const useDashboardKPIs = (params = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', params],
    queryFn: () => api(`/dashboard/stats${buildQueryParams(params)}`),
  });
};

export const useDashboardPipeline = (params = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'pipeline', params],
    queryFn: () => api(`/dashboard/pipeline${buildQueryParams(params)}`),
  });
};

export const useDashboardRevenue = (params = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'revenue', params],
    queryFn: () => api(`/dashboard/revenue${buildQueryParams(params)}`),
  });
};

export const useDashboardLeads = (params = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'leads', params],
    queryFn: () => api(`/dashboard/leads${buildQueryParams(params)}`),
  });
};

export const useDashboardPerformance = (params = {}) => {
  return useQuery({
    queryKey: ['dashboard', 'performance', params],
    queryFn: () => api(`/dashboard/performance${buildQueryParams(params)}`),
  });
};
