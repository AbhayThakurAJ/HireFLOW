import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTask, useDeleteTask, useUpdateTask } from '../hooks/useTasks';
import { Edit, Trash2, ArrowLeft, Calendar, User, Briefcase, FileText } from 'lucide-react';
import { format } from 'date-fns';

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const statusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export default function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: taskData, isLoading } = useTask(id);
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const task = taskData?.data;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(id);
        navigate('/tasks');
      } catch (error) {
        alert(error.response?.data?.error || 'Failed to delete task');
      }
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    try {
      await updateTask.mutateAsync({ id: task.id, status: newStatus });
    } catch (error) {
      alert('Failed to update status');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!task) return <div className="p-8 text-center text-gray-500">Task not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
              task.status === 'COMPLETED' 
                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
                : 'border-transparent text-white bg-green-600 hover:bg-green-700'
            }`}
          >
            {task.status === 'COMPLETED' ? 'Mark as To Do' : 'Mark Complete'}
          </button>
          <Link
            to={`/tasks/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Link>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{task.title}</h3>
            <div className="flex gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
                {task.status.replace('_', ' ')}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                {task.priority} Priority
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{task.description || 'No description provided.'}</dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <Calendar className="h-4 w-4 mr-1" /> Due Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.dueDate ? format(new Date(task.dueDate), 'PPP p') : 'No due date'}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <User className="h-4 w-4 mr-1" /> Assigned To
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
              </dd>
            </div>

            {task.deal && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Briefcase className="h-4 w-4 mr-1" /> Related Deal
                </dt>
                <dd className="mt-1 text-sm text-blue-600 hover:underline">
                  <Link to={`/deals/${task.deal.id}`}>{task.deal.title}</Link>
                </dd>
              </div>
            )}

            {task.lead && (
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <User className="h-4 w-4 mr-1" /> Related Lead
                </dt>
                <dd className="mt-1 text-sm text-blue-600 hover:underline">
                  <Link to={`/leads/${task.lead.id}`}>{task.lead.firstName} {task.lead.lastName}</Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
