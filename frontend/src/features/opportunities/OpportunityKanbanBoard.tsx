import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Building,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react';
import api from '../../api/client';
import { Opportunity, OpportunityStage } from '../../types';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../utils/cn';

interface OpportunityKanbanBoardProps {
  opportunities: Opportunity[];
  onEdit: (opp: Opportunity) => void;
  onDelete: (opp: Opportunity) => void;
}

const STAGES: { id: OpportunityStage; label: string; color: string; border: string; topBorderColor: string }[] = [
  { id: 'QUALIFICATION', label: '1. Qualification', color: 'bg-teal-50 text-teal-900', border: 'border-t-brand-teal', topBorderColor: '#097C87' },
  { id: 'PROPOSAL', label: '2. Proposal', color: 'bg-cyan-50 text-cyan-900', border: 'border-t-brand-cyan', topBorderColor: '#23CED9' },
  { id: 'NEGOTIATION', label: '3. Negotiation', color: 'bg-amber-50 text-amber-900', border: 'border-t-amber-500', topBorderColor: '#f59e0b' },
  { id: 'WON', label: '4. Closed Won', color: 'bg-emerald-50 text-emerald-900', border: 'border-t-emerald-500', topBorderColor: '#10b981' },
  { id: 'LOST', label: '5. Closed Lost', color: 'bg-rose-50 text-rose-900', border: 'border-t-rose-500', topBorderColor: '#f43f5e' },
];

export const OpportunityKanbanBoard: React.FC<OpportunityKanbanBoardProps> = ({
  opportunities,
  onEdit,
  onDelete,
}) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const stageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: number; stage: OpportunityStage }) => {
      return api.patch(`/opportunities/${id}/stage`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Opportunity stage updated.');
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to update opportunity stage.');
    },
  });

  const getStageIndex = (stage: OpportunityStage) => {
    return STAGES.findIndex((s) => s.id === stage);
  };

  const moveOpportunity = (opp: Opportunity, direction: 'prev' | 'next') => {
    const currentIndex = getStageIndex(opp.stage);
    const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= 0 && targetIndex < STAGES.length) {
      stageMutation.mutate({ id: opp.id, stage: STAGES[targetIndex].id });
    }
  };

  return (
    <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4 max-w-full min-w-0">
      {STAGES.map((col, index) => {
        const columnOpps = opportunities.filter((o) => o.stage === col.id);
        const columnTotal = columnOpps.reduce((sum, o) => sum + Number(o.amount), 0);

        return (
          <div
            key={col.id}
            className="flex flex-col bg-gray-50/70 border border-gray-200/70 rounded-xl w-[280px] sm:w-[300px] md:w-auto flex-shrink-0 md:flex-shrink min-w-[260px] max-h-[calc(100vh-280px)]"
          >
            {/* Column Header */}
            <div
              className={`p-3.5 border-t-4 rounded-t-xl bg-white border-b border-b-gray-100 shadow-xs ${col.border}`}
              style={{ borderTopColor: col.topBorderColor }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">{col.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                  {columnOpps.length}
                </span>
              </div>
              <p className="text-xs font-semibold text-brand-teal mt-1">
                {formatCurrency(columnTotal)}
              </p>
            </div>

            {/* Opportunities List Container */}
            {columnOpps.length === 0 ? (
              <div className="py-4 px-3 text-center">
                <p className="text-xs text-gray-400 font-medium">No opportunities</p>
              </div>
            ) : (
              <div className="flex-1 p-2 space-y-2.5 overflow-y-auto">
                {columnOpps.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-3.5 bg-white rounded-lg border border-gray-100 shadow-card hover:shadow-card-hover transition-all space-y-2.5 group"
                  >
                    {/* Deal Title and Edit Action */}
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-bold text-gray-900 line-clamp-2">{opp.opportunityName}</p>
                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEdit(opp)}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded"
                          title="Edit Deal"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDelete(opp)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          title="Delete Deal"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate font-medium">{opp.customerName || 'General Customer'}</span>
                    </div>

                    {/* Amount & Weighted Pipeline */}
                    <div className="flex items-baseline justify-between pt-1 border-t border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(opp.amount)}</p>
                        <p className="text-[10px] text-gray-400">
                          Weighted: {formatCurrency(opp.weightedPipeline || (opp.amount * opp.probability) / 100)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                          {opp.probability}% Prob
                        </span>
                      </div>
                    </div>

                    {/* Close Date & Rep */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        {formatDate(opp.expectedCloseDate)}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[90px]" title={opp.assignedToUserName}>
                        <User className="w-3 h-3 text-gray-400" />
                        {opp.assignedToUserName ? opp.assignedToUserName.split(' ')[0] : 'Unassigned'}
                      </span>
                    </div>

                    {/* Stage Transition Quick Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <button
                        onClick={() => moveOpportunity(opp, 'prev')}
                        disabled={index === 0 || stageMutation.isPending}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move to previous stage"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <select
                        value={opp.stage}
                        onChange={(e) =>
                          stageMutation.mutate({ id: opp.id, stage: e.target.value as OpportunityStage })
                        }
                        className="text-[10px] font-semibold border-none bg-transparent text-gray-500 hover:text-brand-teal cursor-pointer focus:outline-none"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => moveOpportunity(opp, 'next')}
                        disabled={index === STAGES.length - 1 || stageMutation.isPending}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                        title="Move to next stage"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OpportunityKanbanBoard;

