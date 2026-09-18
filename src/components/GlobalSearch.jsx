import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../hooks/useSearch';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useGlobalSearch(debouncedQuery);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (url) => {
    setIsOpen(false);
    setQuery('');
    navigate(url);
  };

  const results = data?.data || { leads: [], contacts: [], companies: [], deals: [] };
  const hasResults = results.leads.length > 0 || results.contacts.length > 0 || results.companies.length > 0 || results.deals.length > 0;

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Search CRM..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {isLoading && debouncedQuery && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {isOpen && debouncedQuery.length > 1 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-96 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {!hasResults ? (
            <div className="px-4 py-2 text-gray-500">No results found for "{debouncedQuery}"</div>
          ) : (
            <>
              {results.leads.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Leads</h3>
                  {results.leads.map(lead => (
                    <div key={lead.id} onClick={() => handleSelect(`/leads/${lead.id}`)} className="cursor-pointer hover:bg-indigo-50 p-2 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                      <p className="text-xs text-gray-500">{lead.email} {lead.company ? `- ${lead.company}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
              {results.contacts.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contacts</h3>
                  {results.contacts.map(contact => (
                    <div key={contact.id} onClick={() => handleSelect(`/contacts/${contact.id}`)} className="cursor-pointer hover:bg-indigo-50 p-2 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-gray-500">{contact.email}</p>
                    </div>
                  ))}
                </div>
              )}
              {results.companies.length > 0 && (
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Companies</h3>
                  {results.companies.map(company => (
                    <div key={company.id} onClick={() => handleSelect(`/companies/${company.id}`)} className="cursor-pointer hover:bg-indigo-50 p-2 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{company.name}</p>
                      <p className="text-xs text-gray-500">{company.industry}</p>
                    </div>
                  ))}
                </div>
              )}
              {results.deals.length > 0 && (
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Deals</h3>
                  {results.deals.map(deal => (
                    <div key={deal.id} onClick={() => handleSelect(`/deals/${deal.id}`)} className="cursor-pointer hover:bg-indigo-50 p-2 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{deal.title}</p>
                      <p className="text-xs text-gray-500">{deal.stage} - ${deal.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
