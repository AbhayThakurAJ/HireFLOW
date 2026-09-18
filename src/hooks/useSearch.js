import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useGlobalSearch = (query) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => api(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 1,
    staleTime: 1000 * 60 * 5,
  });
};
