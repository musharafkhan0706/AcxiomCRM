import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Lead, ApiResponse, User } from '../../types';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface LeadAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const LeadAssignModal: React.FC<LeadAssignModalProps> = ({ isOpen, onClose, lead }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const { data: users } = useQuery<User[]>({
    queryKey: ['users-assignable'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User[]>>('/users');
      return res.data.data;
    },
    enabled: isOpen,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!lead || !selectedUserId) return;
      return api.patch(`/leads/${lead.id}/assign?userId=${selectedUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Lead reassigned successfully.');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to reassign lead.');
    },
  });

  if (!lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Lead: ${lead.leadName}`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-500">
          Currently assigned to:{' '}
          <span className="font-semibold text-gray-800">
            {lead.assignedToUserName || 'Unassigned (General Pool)'}
          </span>
        </p>

        <Select
          label="Select New Owner *"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          options={[
            { value: '', label: '-- Select Representative --' },
            ...(users || []).map((u) => ({
              value: String(u.id),
              label: `${u.name} (${u.role.replace('_', ' ')})`,
            })),
          ]}
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!selectedUserId}
          >
            Assign Lead
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LeadAssignModal;

