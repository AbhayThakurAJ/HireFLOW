import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const fetchDeals = async (params) => {
  const url = new URL('/api/deals', window.location.origin);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch deals');
  return res.json();
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
      const res = await fetch(`/api/deals/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Deal not found');
        throw new Error('Failed to fetch deal');
      }
      return res.json();
    },
    enabled: !!id,
  });
};

export const useCreateDeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create deal');
      }
      return res.json();
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
      const res = await fetch(`/api/deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update deal');
      }
      return res.json();
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
      const res = await fetch(`/api/deals/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update deal stage');
      }
      return res.json();
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
      const res = await fetch(`/api/deals/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete deal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deals']);
    },
  });
};
