import { useParams, Link } from 'react-router-dom';
import { useCompany } from '../hooks/useCompanies';
import { ArrowLeft, Building, Globe, MapPin, Phone, Mail, Users, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

export default function CompanyDetails() {
  const { id } = useParams();
  const { data: company, isLoading, error } = useCompany(id);
  
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error || !company) return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">Company not found</h3>
      <Link to="/companies" className="mt-4 text-indigo-600 hover:text-indigo-500">Back to Companies</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Link to="/companies" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Companies
        </Link>
      </div>

      {/* Header Profile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:flex sm:items-center sm:justify-between border-b border-gray-200">
          <div className="sm:flex sm:space-x-5">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-xl bg-blue-100 flex items-center justify-center border-4 border-white shadow-sm">
                <Building className="h-10 w-10 text-blue-700" />
              </div>
            </div>
            <div className="mt-4 text-center sm:mt-0 sm:pt-1 sm:text-left">
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{company.name}</p>
              <p className="text-sm font-medium text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                {company.industry || 'No industry specified'}
                {company.size && <span className="ml-2 text-gray-400">({company.size} employees)</span>}
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Details */}
        <div className="bg-gray-50 px-6 py-4 flex flex-wrap gap-6 items-center text-sm text-gray-600">
          {company.website && (
            <div className="flex items-center">
              <Globe className="h-4 w-4 text-gray-400 mr-2" />
              <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                {company.website}
              </a>
            </div>
          )}
          {company.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
              {company.location}
            </div>
          )}
          {company.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-400 mr-2" />
              {company.phone}
            </div>
          )}
          {company.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-gray-400 mr-2" />
              <a href={`mailto:${company.email}`} className="text-indigo-600 hover:text-indigo-900">{company.email}</a>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-gray-400" />
              Contacts ({company.contacts?.length || 0})
            </h3>
          </div>
          <div className="p-0">
            {company.contacts && company.contacts.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {company.contacts.map((contact) => (
                  <li key={contact.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-700 font-medium">{contact.firstName[0]}{contact.lastName[0]}</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-gray-500">{contact.jobTitle || 'No title'}</p>
                      </div>
                    </div>
                    <Link to={`/contacts/${contact.id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">View</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No contacts associated with this company.</div>
            )}
          </div>
        </div>

        {/* Deals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-gray-400" />
              Deals ({company.deals?.length || 0})
            </h3>
          </div>
          <div className="p-0">
            {company.deals && company.deals.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {company.deals.map((deal) => (
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
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No deals associated with this company.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
