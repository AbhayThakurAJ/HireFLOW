import React from 'react';
import { format } from 'date-fns';
import { Activity, Phone, Mail, Users, FileText, CheckSquare, RefreshCw } from 'lucide-react';

const icons = {
  CALL: <Phone className="h-4 w-4 text-blue-500" />,
  EMAIL: <Mail className="h-4 w-4 text-green-500" />,
  MEETING: <Users className="h-4 w-4 text-purple-500" />,
  NOTE: <FileText className="h-4 w-4 text-yellow-500" />,
  TASK: <CheckSquare className="h-4 w-4 text-indigo-500" />,
  STATUS_CHANGE: <RefreshCw className="h-4 w-4 text-orange-500" />,
  DEFAULT: <Activity className="h-4 w-4 text-gray-500" />
};

export default function ActivityTimeline({ activities = [] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No activity recorded.</p>;
  }

  return (
    <ul className="-mb-8">
      {activities.map((activity, activityIdx) => (
        <li key={activity.id}>
          <div className="relative pb-8">
            {activityIdx !== activities.length - 1 ? (
              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
            ) : null}
            <div className="relative flex space-x-3">
              <div>
                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                  {icons[activity.type] || icons.DEFAULT}
                </span>
              </div>
              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium text-gray-500">{activity.type?.replace('_', ' ')}</span>
                    <span className="text-gray-900 block mt-1 whitespace-pre-wrap">{activity.content}</span>
                  </p>
                </div>
                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                  <time dateTime={activity.createdAt}>{format(new Date(activity.createdAt), 'MMM d, h:mm a')}</time>
                  <div className="mt-1 text-xs">
                    {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'System'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
