import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useContacts(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const res = await api(`/contacts?${queryParams}`);
      return res;
    },
    keepPreviousData: true,
  });
}

export function useContact(id) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const res = await api(`/contacts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      return await api('/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (variables.companyId) {
        queryClient.invalidateQueries({ queryKey: ['companies', variables.companyId] });
      }
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await api(`/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.id] });
      if (data?.data?.companyId) {
        queryClient.invalidateQueries({ queryKey: ['companies', data.data.companyId] });
      }
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      return await api(`/contacts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
