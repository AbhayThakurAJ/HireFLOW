import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const [health, setHealth] = useState('Checking...');
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data.message))
      .catch((err) => setHealth('API Error'));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Welcome, {user?.firstName}!</h2>
        <p className="text-sm text-gray-500 mt-1">API Status: {health}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Your Role</p>
          <p className="text-xl font-semibold mt-2 text-indigo-600">{user?.role}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Total Leads</p>
          <p className="text-3xl font-semibold mt-2 text-gray-900">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
          <p className="text-3xl font-semibold mt-2 text-gray-900">$0</p>
        </div>
      </div>
    </div>
  );
}
