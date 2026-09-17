import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateDeal, useUpdateDeal, useDeal } from '../hooks/useDeals';
import { useCompanies } from '../hooks/useCompanies';
import { useContacts } from '../hooks/useContacts';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(0, 'Value must be positive'),
  currency: z.string().default('USD'),
  stage: z.enum(['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
  probability: z.number().int().min(0).max(100),
  expectedCloseDate: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
});

export default function DealForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: dealResponse, isLoading: isLoadingDeal } = useDeal(id);
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();

  const { data: companiesResponse } = useCompanies({ limit: 100 });
  const { data: contactsResponse } = useContacts({ limit: 100 });
  const { data: usersResponse } = useUsers();

  const form = useForm({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      value: 0,
      currency: 'USD',
      stage: 'NEW',
      probability: 0,
      expectedCloseDate: '',
      companyId: '',
      contactId: '',
      assignedTo: user?.role === 'SALES_REP' ? user.id : '',
      description: '',
    }
  });

  useEffect(() => {
    if (isEdit && dealResponse?.data) {
      const d = dealResponse.data;
      form.reset({
        title: d.title || '',
        value: d.value || 0,
        currency: d.currency || 'USD',
        stage: d.stage || 'NEW',
        probability: d.probability || 0,
        expectedCloseDate: d.expectedCloseDate ? new Date(d.expectedCloseDate).toISOString().split('T')[0] : '',
        companyId: d.companyId || '',
        contactId: d.contactId || '',
        assignedTo: d.assignedTo || '',
        description: d.description || '',
      });
    }
  }, [isEdit, dealResponse, form]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id, data });
        navigate(`/deals/${id}`);
      } else {
        const res = await createMutation.mutateAsync(data);
        navigate(`/deals/${res.data.id}`);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  if (isEdit && isLoadingDeal) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Deal' : 'Create New Deal'}
        </h1>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Deal Title *</label>
              <input
                {...form.register('title')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Value *</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  {...form.register('value', { valueAsNumber: true })}
                  className="block w-full pl-7 pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2"
                />
              </div>
              {form.formState.errors.value && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.value.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stage</label>
              <select
                {...form.register('stage')}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="NEW">New</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Probability (%)</label>
              <input
                type="number"
                {...form.register('probability', { valueAsNumber: true })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.probability && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.probability.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Close Date</label>
              <input
                type="date"
                {...form.register('expectedCloseDate')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <select
                {...form.register('companyId')}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select Company...</option>
                {companiesResponse?.data?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact</label>
              <select
                {...form.register('contactId')}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select Contact...</option>
                {contactsResponse?.data?.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
            </div>

            {user.role !== 'SALES_REP' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  {...form.register('assignedTo')}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Unassigned</option>
                  {usersResponse?.data?.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...form.register('description')}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isEdit ? 'Save Changes' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
