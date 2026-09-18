import React, { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const { data, isLoading } = useAuditLogs({ page, limit: 20, action, entityType });
  const logs = data?.data?.logs || [];
  const meta = data?.data || { totalPages: 1 };

  if (isLoading) return <div className="p-6">Loading audit logs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="border border-gray-300 rounded-md p-2 text-sm">
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="ASSIGN">ASSIGN</option>
          <option value="STATUS_CHANGE">STATUS_CHANGE</option>
        </select>
        <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="border border-gray-300 rounded-md p-2 text-sm">
          <option value="">All Entities</option>
          <option value="Lead">Lead</option>
          <option value="Contact">Contact</option>
          <option value="Company">Company</option>
          <option value="Deal">Deal</option>
          <option value="Task">Task</option>
          <option value="User">User</option>
        </select>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Changes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.action === 'CREATE' ? 'bg-green-100 text-green-800' : 
                        log.action === 'DELETE' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.entityType} <span className="text-xs text-gray-400">({log.entityId.substring(0,8)}...)</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {log.oldValue && log.newValue ? `${log.oldValue} → ${log.newValue}` : log.newValue || '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No audit logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {meta.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-700">Page {page} of {meta.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
