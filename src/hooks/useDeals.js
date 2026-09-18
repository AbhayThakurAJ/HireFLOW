import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

const fetchDeals = async (params) => {
  const url = new URL('/deals', 'http://localhost'); // Dummy base for URL construction
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const queryStr = url.search;
  return api(`/deals${queryStr}`);
};

export const useDeals = (params) => {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => fetchDeals(params),
  });
};

export const useDeal = (id) => {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: async () => {
      if (!id) return null;
      return api(`/deals/${id}`);
    },
    enabled: !!id,
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      return api('/deals', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    },
  });
};

export const useUpdateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return api(`/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['deals', variables.id]);
    },
  });
};

export const useUpdateDealStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }) => {
      return api(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['deals']);
      queryClient.invalidateQueries(['deals', variables.id]);
    },
  });
};

export const useDeleteDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      return api(`/deals/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    },
  });
};
