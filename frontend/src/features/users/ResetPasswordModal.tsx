import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import { User } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, user }) => {
  const { success, error: toastError } = useToast();
  const [newPassword, setNewPassword] = useState('Password@2026!');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      return api.post(`/users/${user.id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      success(`Password reset for ${user?.email}. Temporary password: ${newPassword}`);
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to reset password.');
    },
  });

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reset Password: ${user.name}`}
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-xs text-gray-600">
          Set a new temporary password for <span className="font-semibold text-gray-900">{user.email}</span>. The user will be required to change it on next login.
        </p>

        <Input
          label="New Password *"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password..."
          type="text"
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            isLoading={mutation.isPending}
            disabled={!newPassword || newPassword.length < 8}
          >
            Confirm Reset
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ResetPasswordModal;

