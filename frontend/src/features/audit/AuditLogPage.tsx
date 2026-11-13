import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Eye,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
} from 'lucide-react';
import api from '../../api/client';
import { AuditLog, PagedResponse, ApiResponse } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import AuditDetailModal from './AuditDetailModal';
import { formatDate } from '../../utils/cn';

export const AuditLogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 15;

  const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data, isLoading } = useQuery<PagedResponse<AuditLog>>({
    queryKey: ['audit-logs', search, entityFilter, actionFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (entityFilter) params.append('entityName', entityFilter);
      if (actionFilter) params.append('action', actionFilter);
      params.append('page', String(page));
      params.append('size', String(size));
      params.append('sortBy', 'timestamp');
      params.append('direction', 'desc');

      const res = await api.get<ApiResponse<PagedResponse<AuditLog>>>(`/audit-logs?${params.toString()}`);
      return res.data.data;
    },
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'teal';
      case 'UPDATE':
      case 'STAGE_CHANGE':
        return 'cyan';
      case 'CONVERT':
        return 'sage';
      case 'DELETE':
        return 'peach';
      case 'LOCKOUT':
        return 'peach';
      case 'UNLOCK':
        return 'yellow';
      default:
        return 'teal';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Compliance & Security Audit Trail</h1>
          <p className="text-xs text-gray-500 mt-1">
            Immutable system-wide ledger of user operations, data mutations, logins, and workflow state transitions.
          </p>
        </div>
      </div>

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
            placeholder="Search audit trail by actor, details..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 w-full sm:w-auto"
          >
            <option value="">All Entities</option>
            <option value="Customer">Customers</option>
            <option value="Lead">Leads</option>
            <option value="Opportunity">Opportunities</option>
            <option value="FollowUp">Follow-Ups</option>
            <option value="User">Users</option>
            <option value="Auth">Authentication</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 w-full sm:w-auto"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="STAGE_CHANGE">Stage Change</option>
            <option value="CONVERT">Lead Convert</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOCKOUT">Lockout</option>
            <option value="UNLOCK">Unlock</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            title="No audit entries found"
            description="Adjust your search query or filters."
            icon={History}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Inspection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-gray-900">
                      {log.username || <span className="text-gray-400 italic">System</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700 font-mono">
                      {log.entityName} {log.recordId ? `#${log.recordId}` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-sm truncate">
                      {log.details || '—'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {log.result}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => {
                          setSelectedAudit(log);
                          setDetailModalOpen(true);
                        }}
                        className="p-1.5 text-brand-deep-teal hover:bg-teal-50 rounded-md transition-colors"
                        title="Inspect diff and metadata"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
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
          </>
        )}
      </div>

      <AuditDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        audit={selectedAudit}
      />
    </div>
  );
};

export default AuditLogPage;

