import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { User, ApiResponse, RoleName } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const userSchema = z.object({
  name: z.string().min(1, 'Full Name is required.'),
  email: z.string().email('Enter a valid business email address.'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']),
  department: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, user }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'SALES_EXECUTIVE',
      department: 'Enterprise Sales',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        password: 'Password@2026!',
        role: 'SALES_EXECUTIVE',
        department: 'Enterprise Sales',
      });
    }
  }, [user, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (isEdit) {
        return api.put<ApiResponse<User>>(`/users/${user.id}`, {
          name: values.name,
          role: values.role,
          department: values.department,
        });
      } else {
        return api.post<ApiResponse<User>>('/users', values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success(isEdit ? 'User record updated successfully.' : 'New CRM user account created.');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to save user account.');
    },
  });

  const onSubmit = (values: UserFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit User: ${user?.name}` : 'Provision New System User'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="Eleanor Vance"
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Corporate Email *"
          type="email"
          placeholder="evance@acxiomcrm.com"
          disabled={isEdit}
          {...register('email')}
          error={errors.email?.message}
        />

        {!isEdit && (
          <Input
            label="Temporary Initial Password *"
            type="text"
            placeholder="Password@2026!"
            {...register('password')}
            error={errors.password?.message}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Security Role *"
            {...register('role')}
            error={errors.role?.message}
            options={[
              { value: 'ADMIN', label: 'Administrator (Full Access)' },
              { value: 'MANAGER', label: 'Sales Manager (Team Scoped)' },
              { value: 'SALES_EXECUTIVE', label: 'Sales Executive (Assigned Scoped)' },
            ]}
          />

          <Input
            label="Department / Unit"
            placeholder="Enterprise Sales"
            {...register('department')}
            error={errors.department?.message}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;

