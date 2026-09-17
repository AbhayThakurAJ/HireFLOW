import RelatedTasks from '../components/RelatedTasks';
import RelatedNotes from '../components/RelatedNotes';
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDeal, useDeleteDeal, useUpdateDealStage } from '../hooks/useDeals';
import { useAuth } from '../hooks/useAuth';
import ActivityTimeline from '../components/ActivityTimeline';
import { Building, Contact as ContactIcon, User, Calendar, DollarSign, Activity, ListTodo, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: response, isLoading, isError } = useDeal(id);
  const deleteMutation = useDeleteDeal();
  const updateStageMutation = useUpdateDealStage();

  const deal = response?.data;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError || !deal) {
    return <div className="text-center p-8 text-red-600 font-medium">Deal not found or you do not have permission.</div>;
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        await deleteMutation.mutateAsync(id);
        navigate('/deals');
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const handleStageChange = async (e) => {
    try {
      await updateStageMutation.mutateAsync({ id, stage: e.target.value });
    } catch (error) {
      alert(error.message);
    }
  };

  const STAGES = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deal.title}</h1>
            <div className="flex items-center mt-2 text-sm text-gray-500 gap-4">
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-1" />
                {deal.company ? (
                  <Link to={`/companies/${deal.company.id}`} className="hover:text-indigo-600 hover:underline">
                    {deal.company.name}
                  </Link>
                ) : 'No Company'}
              </div>
              <div className="flex items-center">
                <ContactIcon className="h-4 w-4 mr-1" />
                {deal.contact ? (
                  <Link to={`/contacts/${deal.contact.id}`} className="hover:text-indigo-600 hover:underline">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </Link>
                ) : 'No Contact'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to={`/deals/${id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Link>
            {user.role !== 'SALES_REP' && (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-gray-200 pt-6">
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center"><DollarSign className="h-4 w-4 mr-1"/> Value</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              ${deal.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Stage</p>
            <div className="mt-1">
              <select
                value={deal.stage}
                onChange={handleStageChange}
                disabled={updateStageMutation.isPending}
                className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Probability</p>
            <div className="mt-1 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${deal.probability}%` }}></div>
              </div>
              <span className="text-sm font-medium text-gray-700">{deal.probability}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 flex items-center"><Calendar className="h-4 w-4 mr-1"/> Expected Close</p>
            <p className="mt-1 text-sm text-gray-900 font-medium">
              {deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), 'MMM d, yyyy') : 'Not set'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
            {deal.description ? (
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{deal.description}</p>
            ) : (
              <p className="text-gray-400 italic text-sm">No description provided.</p>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-gray-400" />
              Activity History
            </h2>
            <div className="flow-root">
              <ActivityTimeline activities={deal.activities} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              Notes
            </h2>
            <RelatedNotes entityType="deal" entityId={deal.id} currentUser={user} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Details</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-gray-500 flex items-center"><User className="h-4 w-4 mr-2"/> Owner</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {deal.assignee ? `${deal.assignee.firstName} ${deal.assignee.lastName}` : 'Unassigned'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="mt-1 text-gray-900">{format(new Date(deal.createdAt), 'MMM d, yyyy')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-gray-900">{format(new Date(deal.updatedAt), 'MMM d, yyyy')}</dd>
              </div>
            </dl>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Tasks</h2>
            <RelatedTasks entityType="deal" entityId={deal.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
