import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Phone,
  Video,
  Mail,
  CheckSquare,
  Building,
  User,
  Clock,
  Edit2,
  Trash2,
  Activity as ActivityIcon,
} from 'lucide-react';
import api from '../../api/client';
import { Activity, ApiResponse } from '../../types';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import ActivityFormModal from './ActivityFormModal';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/cn';

export const ActivityListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const [typeFilter, setTypeFilter] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null);

  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['activities', typeFilter],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Activity[]>>('/activities/recent?limit=50');
      let list = res.data.data;
      if (typeFilter) {
        list = list.filter((a) => a.activityType === typeFilter);
      }
      return list;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Activity entry removed.');
      setDeleteModalOpen(false);
      setActivityToDelete(null);
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to remove activity.');
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone className="w-4 h-4 text-cyan-600" />;
      case 'MEETING':
        return <Video className="w-4 h-4 text-brand-deep-teal" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-amber-600" />;
      case 'TASK':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sales Engagement & Activity Timeline</h1>
          <p className="text-xs text-gray-500 mt-1">
            Chronological audit trail of customer touches, sales calls, presentations, and correspondence.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedActivity(null);
            setFormModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" /> Log Activity
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto max-w-full text-xs">
        {[
          { id: '', label: 'All Activities' },
          { id: 'CALL', label: 'Phone Calls' },
          { id: 'MEETING', label: 'Meetings' },
          { id: 'EMAIL', label: 'Emails' },
          { id: 'TASK', label: 'Tasks' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTypeFilter(tab.id)}
            aria-pressed={typeFilter === tab.id}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 select-none ${
              typeFilter === tab.id
                ? 'bg-brand-teal bg-brand-deep-teal text-white shadow-sm hover:bg-brand-teal-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline View */}
      {isLoading ? (
        <div className="p-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !activities || activities.length === 0 ? (
        <EmptyState
          title="No customer activities logged"
          description="Log sales calls, emails, or completed demo meetings to keep client records up-to-date."
          icon={ActivityIcon}
        />
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
          {activities.map((act) => (
            <div key={act.id} className="relative group">
              {/* Timeline marker icon */}
              <div className="absolute -left-6 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-brand-deep-teal flex items-center justify-center shadow-sm">
                <div className="w-2 h-2 rounded-full bg-brand-deep-teal" />
              </div>

              {/* Activity Card */}
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                      {getActivityIcon(act.activityType)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{act.subject}</h3>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        {act.activityType}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={act.status} />
                    <button
                      onClick={() => {
                        setSelectedActivity(act);
                        setFormModalOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActivityToDelete(act);
                        setDeleteModalOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {act.description && (
                  <p className="text-xs text-gray-600 my-2.5 whitespace-pre-line bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                    {act.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-gray-500">
                  <div className="flex items-center gap-4">
                    {act.customerName && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold text-gray-700">{act.customerName}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span>{act.assignedToUserName || 'Representative'}</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(act.activityDate)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ActivityFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        activity={selectedActivity}
      />

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Activity Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete activity entry:{' '}
            <span className="font-bold text-gray-900">{activityToDelete?.subject}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => activityToDelete && deleteMutation.mutate(activityToDelete.id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityListPage;

