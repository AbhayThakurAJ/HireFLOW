import ActivityTimeline from '../components/ActivityTimeline';
import RelatedTasks from '../components/RelatedTasks';
import RelatedNotes from '../components/RelatedNotes';
import { useAuth } from '../hooks/useAuth';
import { useParams, Link } from 'react-router-dom';
import { useLead, useUpdateLead } from '../hooks/useLeads';
import { ArrowLeft, Mail, Phone, Building, Briefcase, Calendar, Clock, Activity, Edit, UserCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function LeadDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: lead, isLoading, error } = useLead(id);
  const { mutate: updateLead, isPending: isUpdating } = useUpdateLead();
  
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [status, setStatus] = useState('');

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error || !lead) return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">Lead not found</h3>
      <Link to="/leads" className="mt-4 text-indigo-600 hover:text-indigo-500">Back to Leads</Link>
    </div>
  );

  const handleStatusUpdate = () => {
    if (status && status !== lead.status) {
      updateLead({ id, data: { status } }, {
        onSuccess: () => setIsEditingStatus(false)
      });
    } else {
      setIsEditingStatus(false);
    }
  };

  const startEditingStatus = () => {
    setStatus(lead.status);
    setIsEditingStatus(true);
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'NEW': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTACTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'QUALIFIED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CONVERTED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOST': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link to="/leads" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leads
        </Link>
      </div>

      {/* Header Profile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:flex sm:items-center sm:justify-between border-b border-gray-200">
          <div className="sm:flex sm:space-x-5">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-sm">
                <span className="text-2xl font-bold text-indigo-700">{(lead.firstName?.[0] || '') + (lead.lastName?.[0] || '')}</span>
              </div>
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:pt-1 sm:text-left">
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{lead.firstName} {lead.lastName}</p>
              <p className="text-sm font-medium text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building className="h-4 w-4 mr-1.5" />
                {lead.jobTitle} {lead.company && `at ${lead.company}`}
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-center sm:mt-0 sm:ml-4 sm:flex-shrink-0 sm:items-center space-x-3">
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-sm text-gray-500 mb-1">Lead Score</span>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900 mr-2">{lead.score}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${lead.score >= 70 ? 'bg-green-500' : lead.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${lead.score}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions / Status */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">Status:</span>
            {isEditingStatus ? (
              <div className="flex items-center space-x-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="block w-full pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="LOST">Lost</option>
                </select>
                <button onClick={handleStatusUpdate} disabled={isUpdating} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700">Save</button>
                <button onClick={() => setIsEditingStatus(false)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300">Cancel</button>
              </div>
            ) : (
              <span className={`px-2.5 py-1 inline-flex text-sm font-semibold rounded-full border ${getStatusColor(lead.status)}`}>
                {lead.status}
                <button onClick={startEditingStatus} className="ml-2 focus:outline-none opacity-60 hover:opacity-100">
                  <Edit className="h-4 w-4" />
                </button>
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <UserCircle className="h-5 w-5 text-gray-400" />
            <span>Assigned to: {lead.assignee ? `${lead.assignee.firstName} ${lead.assignee.lastName}` : 'Unassigned'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Contact Information</h3>
            </div>
            <div className="px-4 py-5 sm:px-6 space-y-4">
              <div className="flex items-center text-sm">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <a href={`mailto:${lead.email}`} className="text-indigo-600 hover:text-indigo-900 truncate">
                  {lead.email || 'No email'}
                </a>
              </div>
              <div className="flex items-center text-sm">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900">{lead.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-900 capitalize">{lead.source?.toLowerCase().replace('_', ' ') || 'Unknown Source'}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 pt-4 border-t border-gray-100">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                Created {format(new Date(lead.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-gray-400" />
                Activity History
              </h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <ActivityTimeline activities={lead.activities || []} />
            </div>
          </div>
          
          <div className="bg-white shadow sm:rounded-lg mt-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                Notes
              </h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <RelatedNotes entityType="lead" entityId={lead.id} currentUser={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
