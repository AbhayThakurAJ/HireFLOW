import React, { useState, useEffect } from 'react';
import { useDeals, useUpdateDealStage } from '../hooks/useDeals';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const STAGES = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export default function Pipeline() {
  const { data: dealsData, isLoading, isError } = useDeals({ limit: 1000 }); // fetch enough deals for pipeline
  const updateStageMutation = useUpdateDealStage();
  const [localDeals, setLocalDeals] = useState([]);
  const [draggedDealId, setDraggedDealId] = useState(null);
  
  useEffect(() => {
    if (dealsData?.data) {
      setLocalDeals(dealsData.data);
    }
  }, [dealsData]);

  const handleDragStart = (e, dealId) => {
    setDraggedDealId(dealId);
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (!dealId || !newStage) return;

    const deal = localDeals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    // Optimistic update
    const previousDeals = [...localDeals];
    setLocalDeals(localDeals.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

    try {
      await updateStageMutation.mutateAsync({ id: dealId, stage: newStage });
    } catch (error) {
      console.error('Failed to update stage', error);
      // Rollback
      setLocalDeals(previousDeals);
      alert('Failed to update deal stage');
    } finally {
      setDraggedDealId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-600">Failed to load pipeline.</div>;
  }

  // Calculate totals
  const totalPipelineValue = localDeals
    .filter(d => !['LOST'].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total Pipeline Value: ${totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="flex overflow-x-auto space-x-4 pb-4">
        {STAGES.map(stage => {
          const stageDeals = localDeals.filter(d => d.stage === stage);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div 
              key={stage} 
              className="flex-shrink-0 w-80 bg-gray-100 rounded-lg flex flex-col max-h-[calc(100vh-12rem)]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <div className="p-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-700">{stage}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {stageDeals.length} deals • ${stageTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {stageDeals.map(deal => (
                  <div 
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    className={`bg-white p-4 rounded-md shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors ${draggedDealId === deal.id ? 'opacity-50' : ''}`}
                  >
                    <Link to={`/deals/${deal.id}`} className="block font-medium text-gray-900 hover:text-indigo-600 truncate">
                      {deal.title}
                    </Link>
                    {deal.company && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{deal.company.name}</p>
                    )}
                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="font-semibold text-gray-700">
                        ${deal.value.toLocaleString()}
                      </span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        {deal.probability}%
                      </span>
                    </div>
                    {deal.assignee && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 font-medium">
                          {deal.assignee.firstName[0]}
                        </span>
                        {deal.assignee.firstName} {deal.assignee.lastName}
                      </div>
                    )}
                  </div>
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-md">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
