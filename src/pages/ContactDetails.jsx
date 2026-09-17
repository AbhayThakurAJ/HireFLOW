import ActivityTimeline from '../components/ActivityTimeline';
import RelatedNotes from '../components/RelatedNotes';
import { useAuth } from '../hooks/useAuth';
import { useParams, Link } from 'react-router-dom';
import { useContact } from '../hooks/useContacts';
import { ArrowLeft, Building, MapPin, Phone, Mail, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

export default function ContactDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: contact, isLoading, error } = useContact(id);
  
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error || !contact) return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">Contact not found</h3>
      <Link to="/contacts" className="mt-4 text-indigo-600 hover:text-indigo-500">Back to Contacts</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link to="/contacts" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Link>
      </div>

      {/* Header Profile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:flex sm:items-center sm:justify-between border-b border-gray-200">
          <div className="sm:flex sm:space-x-5">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-white shadow-sm">
                <span className="text-2xl font-bold text-indigo-700">{contact.firstName[0]}{contact.lastName[0]}</span>
              </div>
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:pt-1 sm:text-left">
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{contact.firstName} {contact.lastName}</p>
              <p className="text-sm font-medium text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                {contact.jobTitle || 'No job title'}
                {contact.company && (
                  <span className="ml-2 flex items-center">
                    <Building className="h-4 w-4 mr-1 text-gray-400" />
                    <Link to={`/companies/${contact.company.id}`} className="text-indigo-600 hover:text-indigo-900">{contact.company.name}</Link>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-center sm:mt-0 sm:ml-4 sm:flex-shrink-0 sm:items-center">
            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full border ${contact.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
              {contact.status}
            </span>
          </div>
        </div>
        
        {/* Quick Details */}
        <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-6 items-center text-sm text-gray-600">
          {contact.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-2" />
              <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:text-indigo-900">{contact.email}</a>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              {contact.phone}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-gray-400" />
              Associated Deals ({contact.deals?.length || 0})
            </h3>
          </div>
          <div className="p-0">
            {contact.deals && contact.deals.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {contact.deals.map((deal) => (
                  <li key={deal.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                      <span className="text-sm font-bold text-gray-900">${deal.amount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Stage: {deal.stage}</span>
                      <Link to={`/deals/${deal.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No deals associated with this contact.</div>
            )}
          </div>
        </div>
        
        {/* Activity & Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Activity History</h3>
          </div>
          <div className="px-6 py-6">
            <ActivityTimeline activities={contact.activities} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Notes</h3>
          </div>
          <div className="px-6 py-6">
            <RelatedNotes entityType="contact" entityId={contact.id} currentUser={user} />
          </div>
        </div>

      </div>
    </div>
  );
}
