import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useImportLeads = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      // Better to use fetch directly to avoid the json content-type overwrite
      const response = await fetch(`/api/import/leads`, {
         method: 'POST',
         body: formData,
         credentials: 'include'
      });
      if (!response.ok) {
         const err = await response.json().catch(() => ({}));
         throw new Error(err.error || 'Import failed');
      }
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] })
  });
};
export const useExportData = () => {
  const exportCsv = async (entity) => {
    try {
      const response = await fetch(`/api/export/${entity}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entity}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Failed to export CSV');
    }
  };
  return { exportCsv };
};
