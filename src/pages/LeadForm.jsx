import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLead, useCreateLead, useUpdateLead } from '../hooks/useLeads';
import { useAuth } from '../hooks/useAuth';
import { useUsers } from '../hooks/useUsers';
import { AlertCircle, Loader2 } from 'lucide-react';

const leadSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().trim().optional().nullable().or(z.literal('')),
  company: z.string().trim().optional().nullable().or(z.literal('')),
  jobTitle: z.string().trim().optional().nullable().or(z.literal('')),
  source: z.enum(['WEBSITE', 'LINKEDIN', 'REFERRAL', 'ADVERTISEMENT', 'COLD_CALL', 'EMAIL', 'OTHER']).optional().nullable(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
});

export default function LeadForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;
  const [submitError, setSubmitError] = useState(null);

  const { data: leadResponse, isLoading: isLoadingLead } = useLead(id);
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const { data: usersResponse } = useUsers();

  const form = useForm({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      source: 'OTHER',
      status: 'NEW',
      assignedTo: user?.role === 'SALES_REP' ? (user?.id || '') : '',
      notes: '',
    }
  });

  useEffect(() => {
    if (!isEdit && user?.role === 'SALES_REP' && user?.id) {
      if (!form.getValues('assignedTo')) {
        form.setValue('assignedTo', user.id);
      }
    }
  }, [isEdit, user, form]);

  useEffect(() => {
    if (isEdit && leadResponse?.data) {
      const d = leadResponse.data;
      form.reset({
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: d.email || '',
        phone: d.phone || '',
        company: d.company || '',
        jobTitle: d.jobTitle || '',
        source: d.source || 'OTHER',
        status: d.status || 'NEW',
        assignedTo: d.assignedTo || '',
        notes: d.notes || '',
      });
    }
  }, [isEdit, leadResponse, form]);

  const onSubmit = async (data) => {
    setSubmitError(null);
    try {
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        company: data.company?.trim() || null,
        jobTitle: data.jobTitle?.trim() || null,
        source: data.source || 'OTHER',
        status: data.status || 'NEW',
        assignedTo: data.assignedTo || null,
        notes: data.notes?.trim() || null,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id, data: payload });
        navigate(`/leads/${id}`);
      } else {
        const res = await createMutation.mutateAsync(payload);
        if (res?.data?.id) {
          navigate(`/leads/${res.data.id}`);
        } else {
          navigate('/leads');
        }
      }
    } catch (error) {
      console.error('Failed to save lead:', error);
      setSubmitError(error.message || 'Failed to save lead. Please check the fields and try again.');
    }
  };

  const onError = (errors) => {
    console.error('Lead form validation errors:', errors);
    const messages = Object.values(errors).map(err => err?.message).filter(Boolean);
    if (messages.length > 0) {
      setSubmitError(messages.join('. '));
    } else {
      setSubmitError('Please correct the errors in the form before submitting.');
    }
  };

  const isSaving = form.formState.isSubmitting || createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoadingLead) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Lead' : 'Create New Lead'}
        </h1>

        {submitError && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error saving lead</p>
              <p className="mt-1">{submitError}</p>
            </div>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                {...form.register('firstName')}
                placeholder="e.g. Jane"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                {...form.register('lastName')}
                placeholder="e.g. Smith"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                {...form.register('email')}
                placeholder="e.g. jane@company.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                {...form.register('phone')}
                placeholder="e.g. +1 555-0199"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input
                {...form.register('company')}
                placeholder="e.g. Acme Corp"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.company && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.company.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Title</label>
              <input
                {...form.register('jobTitle')}
                placeholder="e.g. Director of Operations"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.jobTitle && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.jobTitle.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <select
                {...form.register('source')}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="WEBSITE">Website</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="REFERRAL">Referral</option>
                <option value="ADVERTISEMENT">Advertisement</option>
                <option value="COLD_CALL">Cold Call</option>
                <option value="EMAIL">Email</option>
                <option value="OTHER">Other</option>
              </select>
              {form.formState.errors.source && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.source.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                {...form.register('status')}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="CONVERTED">Converted</option>
                <option value="LOST">Lost</option>
              </select>
              {form.formState.errors.status && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.status.message}</p>
              )}
            </div>

            {user?.role !== 'SALES_REP' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <select
                  {...form.register('assignedTo')}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Unassigned</option>
                  {usersResponse?.data?.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                {form.formState.errors.assignedTo && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.assignedTo.message}</p>
                )}
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notes (Internal)</label>
              <textarea
                {...form.register('notes')}
                rows={4}
                placeholder="Add any context or next steps..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {form.formState.errors.notes && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.notes.message}</p>
              )}
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
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? (isSaving ? 'Saving Changes...' : 'Save Changes') : (isSaving ? 'Creating Lead...' : 'Create Lead')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
