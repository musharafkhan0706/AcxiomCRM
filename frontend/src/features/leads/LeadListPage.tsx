import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Building,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Target,
  UserCheck,
  ArrowRightLeft,
  DollarSign,
} from 'lucide-react';
import api from '../../api/client';
import { Lead, PagedResponse, ApiResponse } from '../../types';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import LeadFormModal from './LeadFormModal';
import LeadAssignModal from './LeadAssignModal';
import LeadConvertModal from './LeadConvertModal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/cn';

export const LeadListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState<Lead | null>(null);

  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  const { data, isLoading } = useQuery<PagedResponse<Lead>>({
    queryKey: ['leads', search, statusFilter, priorityFilter, sourceFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      params.append('page', String(page));
      params.append('size', String(size));
      params.append('sortBy', 'createdAt');
      params.append('direction', 'desc');

      const res = await api.get<ApiResponse<PagedResponse<Lead>>>(`/leads?${params.toString()}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Lead record deleted successfully.');
      setDeleteModalOpen(false);
      setLeadToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to delete lead record.');
    },
  });

  const handleOpenEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setFormModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedLead(null);
    setFormModalOpen(true);
  };

  const handleOpenAssign = (lead: Lead) => {
    setLeadToAssign(lead);
    setAssignModalOpen(true);
  };

  const handleOpenConvert = (lead: Lead) => {
    setLeadToConvert(lead);
    setConvertModalOpen(true);
  };

  const handleOpenDelete = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Lead Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Capture, qualify, assign, and convert new revenue inquiries through your sales funnel.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Lead
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search leads by name, email, code..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20"
          >
            <option value="">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="REFERRAL">Referral</option>
            <option value="COLD_CALL">Cold Call</option>
            <option value="CAMPAIGN">Campaign</option>
            <option value="PARTNER">Partner</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            title="No sales leads found"
            description="Start growing your pipeline by adding a new lead or clearing search filters."
            icon={Target}
            action={
              <Button onClick={handleOpenCreate} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Lead
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Lead / Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Expected Value</TableHead>
                  <TableHead>Priority & Source</TableHead>
                  <TableHead>Assigned Rep</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-semibold text-brand-deep-teal">
                      {l.leadCode}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900">{l.leadName}</p>
                      {l.companyName && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" /> {l.companyName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{l.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{l.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-xs text-gray-900">
                      {formatCurrency(l.expectedValue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={l.priority} />
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                          {l.source}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      {l.assignedToUserName || <span className="text-gray-400 italic">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Convert Lead Action */}
                        {l.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleOpenConvert(l)}
                            className="p-1.5 text-brand-deep-teal hover:bg-teal-50 rounded-md transition-colors"
                            title="Convert to Customer & Deal"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        )}
                        {/* Reassign Lead Action */}
                        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                          <button
                            onClick={() => handleOpenAssign(l)}
                            className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-md transition-colors"
                            title="Reassign Representative"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                          <button
                            onClick={() => handleOpenDelete(l)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Lead"
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

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50/50">
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
          </>
        )}
      </div>

      {/* Modals */}
      <LeadFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        lead={selectedLead}
      />

      <LeadAssignModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        lead={leadToAssign}
      />

      <LeadConvertModal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        lead={leadToConvert}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Lead Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete lead{' '}
            <span className="font-bold text-gray-900">{leadToDelete?.leadName}</span> (
            {leadToDelete?.leadCode})?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => leadToDelete && deleteMutation.mutate(leadToDelete.id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LeadListPage;

