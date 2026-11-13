import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../api/client';
import { Opportunity, PagedResponse, ApiResponse, PipelineSummary, OpportunityStage } from '../../types';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import OpportunityFormModal from './OpportunityFormModal';
import OpportunityKanbanBoard from './OpportunityKanbanBoard';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/cn';

export const OpportunityListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 15;

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [oppToDelete, setOppToDelete] = useState<Opportunity | null>(null);

  // Pipeline summary statistics
  const { data: pipelineSummary } = useQuery<PipelineSummary>({
    queryKey: ['pipeline-summary'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PipelineSummary>>('/opportunities/pipeline-summary');
      return res.data.data;
    },
  });

  // Query opportunities for table or kanban
  const { data, isLoading } = useQuery<PagedResponse<Opportunity>>({
    queryKey: ['opportunities', search, stageFilter, page, viewMode],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (stageFilter) params.append('stage', stageFilter);
      // For kanban we pull a larger set so columns populate cleanly
      params.append('page', viewMode === 'kanban' ? '0' : String(page));
      params.append('size', viewMode === 'kanban' ? '100' : String(size));
      params.append('sortBy', 'createdAt');
      params.append('direction', 'desc');

      const res = await api.get<ApiResponse<PagedResponse<Opportunity>>>(`/opportunities?${params.toString()}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/opportunities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Opportunity deleted successfully.');
      setDeleteModalOpen(false);
      setOppToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to delete opportunity.');
    },
  });

  const handleOpenEdit = (opp: Opportunity) => {
    setSelectedOpp(opp);
    setFormModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedOpp(null);
    setFormModalOpen(true);
  };

  const handleOpenDelete = (opp: Opportunity) => {
    setOppToDelete(opp);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sales Pipeline & Opportunities</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track multi-stage revenue opportunities, weighted forecasts, and deal closure probabilities.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Mode Toggle */}
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-100/80 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              aria-pressed={viewMode === 'kanban'}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-w-[76px] select-none ${
                viewMode === 'kanban'
                  ? 'bg-brand-teal text-white shadow-sm hover:bg-brand-teal-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <LayoutGrid className={`w-3.5 h-3.5 ${viewMode === 'kanban' ? 'text-white' : 'text-gray-500'}`} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-w-[76px] select-none ${
                viewMode === 'list'
                  ? 'bg-brand-teal text-white shadow-sm hover:bg-brand-teal-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
              }`}
            >
              <List className={`w-3.5 h-3.5 ${viewMode === 'list' ? 'text-white' : 'text-gray-500'}`} />
              <span>List</span>
            </button>
          </div>

          <Button onClick={handleOpenCreate} className="flex items-center justify-center gap-2 flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" /> Add Opportunity
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {pipelineSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 text-brand-deep-teal">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Pipeline</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(pipelineSummary.totalAmount)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-50 text-cyan-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Weighted Forecast</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(pipelineSummary.totalWeightedAmount)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Closed Won</p>
              <p className="text-base font-bold text-emerald-900">{formatCurrency(pipelineSummary.wonAmount)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Deals</p>
              <p className="text-base font-bold text-gray-900">{pipelineSummary.openOpportunities}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search deals by name or customer..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
          />
        </div>

        {viewMode === 'list' && (
          <select
            value={stageFilter}
            onChange={(e) => {
              setStageFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 w-full md:w-52"
          >
            <option value="">All Stages</option>
            <option value="QUALIFICATION">Qualification</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Closed Won</option>
            <option value="LOST">Closed Lost</option>
          </select>
        )}
      </div>

      {/* Main View Area: Kanban or List */}
      {isLoading ? (
        <div className="p-8 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : viewMode === 'kanban' ? (
        <OpportunityKanbanBoard
          opportunities={data?.content || []}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No sales opportunities in view"
          description="Create your first deal opportunity or adjust your search filter criteria."
          icon={Briefcase}
          action={
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Opportunity
            </Button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Probability</TableHead>
                <TableHead>Weighted</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((opp) => (
                <TableRow key={opp.id}>
                  <TableCell className="font-semibold text-xs text-gray-900">
                    {opp.opportunityName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Building className="w-3.5 h-3.5 text-gray-400" />
                      <span>{opp.customerName || 'General Customer'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-gray-900">
                    {formatCurrency(opp.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={opp.stage} />
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-gray-700">
                    {opp.probability}%
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-600">
                    {formatCurrency(opp.weightedPipeline)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {formatDate(opp.expectedCloseDate)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-700">
                    {opp.assignedToUserName || <span className="text-gray-400 italic">Unassigned</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(opp)}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        title="Edit Opportunity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                        <button
                          onClick={() => handleOpenDelete(opp)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Opportunity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* List Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50/50">
            <p>
              Showing {data.page * data.size + 1} to {Math.min((data.page + 1) * data.size, data.totalElements)} of{' '}
              {data.totalElements} records
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.page === 0}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Button>
              <span className="font-semibold text-gray-700">
                Page {data.page + 1} of {Math.max(1, data.totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last || data.page + 1 >= data.totalPages}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <OpportunityFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        opportunity={selectedOpp}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Deal Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete opportunity{' '}
            <span className="font-bold text-gray-900">{oppToDelete?.opportunityName}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => oppToDelete && deleteMutation.mutate(oppToDelete.id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OpportunityListPage;

