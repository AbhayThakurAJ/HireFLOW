import React from 'react';
import { Link } from 'react-router-dom';
import { useTasks, useUpdateTask } from '../hooks/useTasks';
import { CheckSquare, Calendar, Circle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const statusIcons = {
  TODO: <Circle className="h-4 w-4 text-gray-400" />,
  IN_PROGRESS: <Clock className="h-4 w-4 text-blue-500" />,
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
};

export default function RelatedTasks({ entityType, entityId }) {
  const params = { limit: 10 };
  if (entityType === 'deal') params.dealId = entityId;
  if (entityType === 'lead') params.leadId = entityId;
  
  const { data, isLoading } = useTasks(params);
  const updateTask = useUpdateTask();

  const handleStatusToggle = (task) => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    updateTask.mutate({ id: task.id, status: newStatus });
  };

  if (isLoading) return <div className="text-gray-500 text-sm py-4">Loading tasks...</div>;
  const tasks = data?.data || [];

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">No related tasks.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {tasks.map(task => (
            <li key={task.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <button onClick={() => handleStatusToggle(task)} className="mr-3 focus:outline-none">
                  {statusIcons[task.status]}
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    <Link to={`/tasks/${task.id}`} className="hover:text-blue-600">
                      {task.title}
                    </Link>
                  </p>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]} mr-2`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(task.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-2">
        <Link
          to={`/tasks/new?${entityType}Id=${entityId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          + Add Task
        </Link>
      </div>
    </div>
  );
}
