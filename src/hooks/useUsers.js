import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api('/users');
      return res;
    },
  });
};
