import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  Video,
  Mail,
  Presentation,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../api/client';
import { FollowUp, PagedResponse, ApiResponse, FollowUpStatus } from '../../types';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import FollowUpFormModal from './FollowUpFormModal';
import FollowUpCompleteModal from './FollowUpCompleteModal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/cn';

export const FollowUpListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'overdue'>(
    tabParam === 'overdue' ? 'overdue' : tabParam === 'upcoming' ? 'upcoming' : 'all'
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [followUpToComplete, setFollowUpToComplete] = useState<FollowUp | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [followUpToDelete, setFollowUpToDelete] = useState<FollowUp | null>(null);

  const handleTabChange = (tab: 'all' | 'upcoming' | 'overdue') => {
    setActiveTab(tab);
    setPage(0);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  const { data, isLoading } = useQuery<PagedResponse<FollowUp> | FollowUp[]>({
    queryKey: ['followups', activeTab, search, typeFilter, statusFilter, page],
    queryFn: async () => {
      if (activeTab === 'upcoming') {
        const res = await api.get<ApiResponse<FollowUp[]>>('/followups/upcoming');
        return res.data.data;
      } else if (activeTab === 'overdue') {
        const res = await api.get<ApiResponse<FollowUp[]>>('/followups/overdue');
        return res.data.data;
      } else {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (typeFilter) params.append('type', typeFilter);
        if (statusFilter) params.append('status', statusFilter);
        params.append('page', String(page));
        params.append('size', String(size));
        params.append('sortBy', 'followUpDate');
        params.append('direction', 'asc');

        const res = await api.get<ApiResponse<PagedResponse<FollowUp>>>(`/followups?${params.toString()}`);
        return res.data.data;
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/followups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Follow-up deleted successfully.');
      setDeleteModalOpen(false);
      setFollowUpToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to delete follow-up.');
    },
  });

  const getFollowUpIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-3.5 h-3.5 text-cyan-600" />;
      case 'MEETING':
        return <Video className="w-3.5 h-3.5 text-brand-deep-teal" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-amber-600" />;
      case 'DEMO':
        return <Presentation className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const followUpList: FollowUp[] = Array.isArray(data) ? data : data?.content || [];
  const isPaged = !Array.isArray(data) && data !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Follow-Up & SLA Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Ensure high client engagement velocity with scheduled calls, demos, and automated SLA tracking.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedFollowUp(null);
            setFormModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Schedule Follow-Up
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto max-w-full text-xs">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          aria-pressed={activeTab === 'all'}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 select-none ${
            activeTab === 'all'
              ? 'bg-brand-teal bg-brand-deep-teal text-white shadow-sm hover:bg-brand-teal-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 border border-gray-200'
          }`}
        >
          All Scheduled Follow-Ups
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('upcoming')}
          aria-pressed={activeTab === 'upcoming'}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 select-none ${
            activeTab === 'upcoming'
              ? 'bg-brand-teal bg-brand-deep-teal text-white shadow-sm hover:bg-brand-teal-600'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 border border-gray-200'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${activeTab === 'upcoming' ? 'text-white' : 'text-gray-500'}`} />
          Next 7 Days
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('overdue')}
          aria-pressed={activeTab === 'overdue'}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 select-none ${
            activeTab === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700'
              : 'text-gray-600 hover:text-rose-600 hover:bg-rose-50 bg-white/80 border border-gray-200'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${activeTab === 'overdue' ? 'text-white' : 'text-rose-500'}`} />
          Overdue SLAs
        </button>
      </div>

      {/* Filter and Search Bar (Active on All tab) */}
      {activeTab === 'all' && (
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
              placeholder="Search by subject or account..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 w-full sm:w-auto"
            >
              <option value="">All Types</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Meeting</option>
              <option value="EMAIL">Email</option>
              <option value="DEMO">Demo</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="COMPLETED">Completed</option>
              <option value="MISSED">Missed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : followUpList.length === 0 ? (
          <EmptyState
            title={
              activeTab === 'overdue'
                ? 'No overdue follow-ups! Great work!'
                : 'No follow-up engagements found'
            }
            description="Schedule interactions with leads and customers to advance sales opportunities."
            icon={Calendar}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type & Subject</TableHead>
                  <TableHead>Related Account / Deal</TableHead>
                  <TableHead>Scheduled Date & Time</TableHead>
                  <TableHead>Assigned Rep</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes / Outcome</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followUpList.map((fu) => (
                  <TableRow key={fu.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-gray-50 border border-gray-100">
                          {getFollowUpIcon(fu.followUpType)}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-gray-900">{fu.subject}</p>
                          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            {fu.followUpType}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      {fu.customerName ? (
                        <span className="font-medium">{fu.customerName} (Customer)</span>
                      ) : fu.leadName ? (
                        <span className="font-medium">{fu.leadName} (Lead)</span>
                      ) : fu.opportunityName ? (
                        <span className="font-medium">{fu.opportunityName} (Deal)</span>
                      ) : (
                        <span className="text-gray-400 italic">General</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-gray-900">
                      {formatDate(fu.followUpDate)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      {fu.assignedToUserName || <span className="text-gray-400 italic">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={fu.status} />
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                      {fu.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {fu.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setFollowUpToComplete(fu);
                              setCompleteModalOpen(true);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Mark Complete & Log Outcome"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedFollowUp(fu);
                            setFormModalOpen(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit Follow-Up"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setFollowUpToDelete(fu);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Follow-Up"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isPaged && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50/50">
                <p>
                  Showing {data.page * data.size + 1} to{' '}
                  {Math.min((data.page + 1) * data.size, data.totalElements)} of {data.totalElements} records
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
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <FollowUpFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        followUp={selectedFollowUp}
      />

      <FollowUpCompleteModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        followUp={followUpToComplete}
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Follow-Up Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to cancel and delete follow-up:{' '}
            <span className="font-bold text-gray-900">{followUpToDelete?.subject}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => followUpToDelete && deleteMutation.mutate(followUpToDelete.id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FollowUpListPage;

