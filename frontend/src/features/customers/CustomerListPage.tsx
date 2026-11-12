import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Building,
  Building2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import api from '../../api/client';
import { Customer, PagedResponse, ApiResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import CustomerFormModal from './CustomerFormModal';
import Customer360Modal from './Customer360Modal';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';

export const CustomerListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('query') || searchParams.get('search') || '';
  const initialStatus = searchParams.get('status') || '';

  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(0);
  const size = 10;

  // Sync state if URL search params change (e.g. from top nav global search)
  useEffect(() => {
    const urlQuery = searchParams.get('query') || searchParams.get('search') || '';
    const urlStatus = searchParams.get('status') || '';
    if (urlQuery !== search) {
      setSearch(urlQuery);
      setPage(0);
    }
    if (urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
      setPage(0);
    }
  }, [searchParams]);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [view360Open, setView360Open] = useState(false);
  const [viewCustomerId, setViewCustomerId] = useState<number | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery<PagedResponse<Customer>>({
    queryKey: ['customers', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        params.append('query', trimmedSearch);
        params.append('search', trimmedSearch);
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      params.append('page', String(page));
      params.append('size', String(size));
      params.append('sortBy', 'createdAt');
      params.append('direction', 'desc');

      const res = await api.get<ApiResponse<PagedResponse<Customer>>>(`/customers?${params.toString()}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Customer record deleted successfully.');
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to delete customer record.');
    },
  });

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setFormModalOpen(true);
  };

  const handleOpen360 = (id: number) => {
    setViewCustomerId(id);
    setView360Open(true);
  };

  const handleOpenDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(0);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Customer Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Maintain high-value enterprise accounts, client profiles, and historical business relationships.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, company, email, phone, code..."
            className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(0);
              }}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal w-full sm:w-44"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Accounts</option>
              <option value="INACTIVE">Inactive Accounts</option>
            </select>
          </div>

          {/* Record Count Badge */}
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            Total Customers: <span className="font-bold text-gray-800">{data?.totalElements ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={
              search.trim() || statusFilter
                ? 'No customer records match your current search and filter criteria. Try adjusting your query or clearing filters.'
                : 'Get started by registering your first enterprise customer.'
            }
            icon={Building2}
            action={
              search.trim() || statusFilter ? (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={handleOpenCreate} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Customer
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Code</TableHead>
                  <TableHead>Client / Company</TableHead>
                  <TableHead>Contact Information</TableHead>
                  <TableHead>Assigned Rep</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-semibold text-brand-deep-teal">
                      {c.customerCode}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-gray-900">{c.customerName}</p>
                      {c.companyName && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" /> {c.companyName}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{c.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-700">
                      {c.assignedToUserName || <span className="text-gray-400 italic">Unassigned</span>}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpen360(c.id)}
                          className="p-1.5 text-brand-deep-teal hover:bg-teal-50 rounded-md transition-colors"
                          title="View 360° Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                          <button
                            onClick={() => handleOpenDelete(c)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                            title="Delete Customer"
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
                {data.totalElements === 0
                  ? 'Showing 0 records'
                  : `Showing ${data.page * data.size + 1} to ${Math.min((data.page + 1) * data.size, data.totalElements)} of ${data.totalElements} records`}
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
      <CustomerFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        customer={selectedCustomer}
      />

      <Customer360Modal
        isOpen={view360Open}
        onClose={() => setView360Open(false)}
        customerId={viewCustomerId}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Customer Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete customer{' '}
            <span className="font-bold text-gray-900">{customerToDelete?.customerName}</span> (
            {customerToDelete?.customerCode})? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => customerToDelete && deleteMutation.mutate(customerToDelete.id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerListPage;
