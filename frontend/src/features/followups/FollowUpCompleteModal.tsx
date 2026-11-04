import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { FollowUp } from '../../types';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface FollowUpCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp: FollowUp | null;
}

export const FollowUpCompleteModal: React.FC<FollowUpCompleteModalProps> = ({ isOpen, onClose, followUp }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!followUp) return;
      return api.patch(`/followups/${followUp.id}/complete`, { outcomeNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Follow-up marked as completed with outcome notes.');
      setOutcomeNotes('');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to complete follow-up.');
    },
  });

  if (!followUp) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Follow-Up Engagement"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs space-y-1">
          <p className="font-semibold text-gray-900">{followUp.subject}</p>
          <p className="text-gray-500">
            Type: {followUp.followUpType} • With: {followUp.customerName || followUp.leadName || 'General'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Meeting / Call Outcome Notes *
          </label>
          <textarea
            rows={4}
            value={outcomeNotes}
            onChange={(e) => setOutcomeNotes(e.target.value)}
            placeholder="Record summary of client discussion, agreed next steps, objections raised, decision timeline..."
            className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!outcomeNotes.trim()}
          >
            Mark Complete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default FollowUpCompleteModal;

