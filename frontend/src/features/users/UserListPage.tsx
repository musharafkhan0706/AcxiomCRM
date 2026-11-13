import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Users,
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Edit2,
  UserCheck,
  UserX,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/client';
import { User, ApiResponse } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import UserFormModal from './UserFormModal';
import ResetPasswordModal from './ResetPasswordModal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/cn';
import { normalizeUsersList } from '../../utils/normalize';

export const UserListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [search, setSearch] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);

  const { data: rawUsers, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/users?size=100');
      return normalizeUsersList(res.data?.data);
    },
  });

  const users = normalizeUsersList(rawUsers);

  const statusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return api.patch(`/users/${id}/status?active=${active}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success('User active status updated.');
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to update user status.');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/users/${id}/unlock`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success('Account successfully unlocked and failed attempt counter reset.');
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to unlock user.');
    },
  });

  const filteredUsers = (users || []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'teal';
      case 'MANAGER':
        return 'cyan';
      case 'SALES_EXECUTIVE':
        return 'sage';
      default:
        return 'teal';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">User Administration & Security</h1>
          <p className="text-xs text-gray-500 mt-1">
            Provision user accounts, configure role-based access controls, manage lockouts, and reset credentials.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setFormModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Provision User
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, department..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium text-center sm:text-right">
          Total Users: <span className="font-bold text-gray-800">{filteredUsers.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Adjust your search query or provision a new user."
            icon={Users}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Identity</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Security / Lockout</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-semibold text-xs text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(u.role)}>
                      {u.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {u.department || '—'}
                  </TableCell>
                  <TableCell>
                    {u.active ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        <XCircle className="w-3 h-3 text-gray-400" /> Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.locked ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Lock className="w-3 h-3 text-rose-600" /> Locked Out
                        </span>
                        <button
                          onClick={() => unlockMutation.mutate(u.id)}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors"
                          title="Clear lockout and reset attempts"
                        >
                          Unlock
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-500">
                        Normal ({u.failedLoginCount || 0} failed)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => statusMutation.mutate({ id: u.id, active: !u.active })}
                        className={`p-1.5 rounded-md transition-colors ${
                          u.active ? 'text-gray-500 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.active ? 'Deactivate User' : 'Activate User'}
                      >
                        {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>

                      {/* Reset Password */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserToReset(u);
                          setResetModalOpen(true);
                        }}
                        className="p-1.5 text-brand-teal hover:bg-teal-50 rounded-md transition-colors"
                        title="Reset User Password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Edit User */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setFormModalOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        title="Edit User Profile & Role"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        user={selectedUser}
      />

      <ResetPasswordModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        user={userToReset}
      />
    </div>
  );
};

export default UserListPage;

