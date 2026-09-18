import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useAuditLogs = (params) => {
  const query = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))).toString();
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => api(`/audit-logs?${query}`),
  });
};
