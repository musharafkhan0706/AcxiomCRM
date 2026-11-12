import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Activity, ApiResponse, User, Customer, Lead, Opportunity, ActivityType, ActivityStatus } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { normalizeUsersList } from '../../utils/normalize';

const activitySchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  activityType: z.enum(['CALL', 'MEETING', 'EMAIL', 'TASK']),
  activityDate: z.string().min(1, 'Activity date and time is required.'),
  status: z.enum(['PLANNED', 'COMPLETED', 'CANCELLED']).default('COMPLETED'),
  customerId: z.coerce.number().optional(),
  leadId: z.coerce.number().optional(),
  opportunityId: z.coerce.number().optional(),
  assignedToUserId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val)) || Number(val) <= 0 ? undefined : Number(val)),
    z.number().optional()
  ),
  description: z.string().optional(),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity?: Activity | null;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({ isOpen, onClose, activity }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!activity;

  const getInitialDateTime = () => new Date().toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      subject: '',
      activityType: 'CALL',
      activityDate: getInitialDateTime(),
      status: 'COMPLETED',
      customerId: undefined,
      leadId: undefined,
      opportunityId: undefined,
      assignedToUserId: undefined,
      description: '',
    },
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers-all'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Customer[]>>('/customers/all');
      return res.data.data;
    },
    enabled: isOpen,
  });

  const { data: rawUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-assignable'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>('/users/assignable');
      return normalizeUsersList(res.data?.data);
    },
    enabled: isOpen,
  });

  const users = normalizeUsersList(rawUsers);

  useEffect(() => {
    if (activity) {
      reset({
        subject: activity.subject,
        activityType: activity.activityType,
        activityDate: activity.activityDate ? activity.activityDate.slice(0, 16) : getInitialDateTime(),
        status: activity.status,
        customerId: activity.customerId,
        leadId: activity.leadId,
        opportunityId: activity.opportunityId,
        assignedToUserId: activity.assignedToUserId ? Number(activity.assignedToUserId) : undefined,
        description: activity.description || '',
      });
    } else {
      reset({
        subject: '',
        activityType: 'CALL',
        activityDate: getInitialDateTime(),
        status: 'COMPLETED',
        customerId: undefined,
        leadId: undefined,
        opportunityId: undefined,
        assignedToUserId: undefined,
        description: '',
      });
    }
  }, [activity, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: ActivityFormValues) => {
      const payload = {
        ...values,
        activityDate: new Date(values.activityDate).toISOString(),
      };
      if (isEdit) {
        return api.put<ApiResponse<Activity>>(`/activities/${activity.id}`, payload);
      } else {
        return api.post<ApiResponse<Activity>>('/activities', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success(isEdit ? 'Activity updated successfully.' : 'New activity logged successfully.');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to log activity.');
    },
  });

  const onSubmit = (values: ActivityFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Activity: ${activity?.subject}` : 'Log Client Engagement Activity'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Activity Subject *"
          placeholder="e.g. Discovery Call with CTO"
          {...register('subject')}
          error={errors.subject?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Activity Type *"
            {...register('activityType')}
            error={errors.activityType?.message}
            options={[
              { value: 'CALL', label: 'Phone Call' },
              { value: 'MEETING', label: 'Executive Meeting' },
              { value: 'EMAIL', label: 'Email Thread' },
              { value: 'TASK', label: 'Internal Task' },
            ]}
          />

          <Select
            label="Activity Status *"
            {...register('status')}
            error={errors.status?.message}
            options={[
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'PLANNED', label: 'Planned' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date & Time *"
            type="datetime-local"
            {...register('activityDate')}
            error={errors.activityDate?.message}
          />

          <Select
            label="Related Customer"
            {...register('customerId')}
            error={errors.customerId?.message}
            options={[
              { value: '', label: '-- None (General) --' },
              ...(customers || []).map((c) => ({
                value: String(c.id),
                label: `${c.customerName} (${c.customerCode})`,
              })),
            ]}
          />
        </div>

        {(() => {
          const currentAssignedId = activity?.assignedToUserId ? Number(activity.assignedToUserId) : undefined;
          const assignedExists = currentAssignedId ? users.some((u) => u.id === currentAssignedId) : false;
          const userOptions = [
            { value: '', label: 'Myself (Default)' },
            ...(!assignedExists && currentAssignedId
              ? [{
                  value: String(currentAssignedId),
                  label: activity?.assignedToUserName
                    ? `${activity.assignedToUserName} (Currently Assigned)`
                    : `User #${currentAssignedId} (Assigned)`,
                }]
              : []),
            ...users.map((u) => ({
              value: String(u.id),
              label: `${u.name} (${(u.role || '').replace('_', ' ')})`,
            })),
          ];

          return (
            <Select
              label="Logged Representative"
              {...register('assignedToUserId')}
              error={errors.assignedToUserId?.message}
              options={userOptions}
              disabled={isLoadingUsers}
            />
          );
        })()}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Details & Description</label>
          <textarea
            rows={3}
            placeholder="Record salient minutes, requirements, next action items..."
            {...register('description')}
            className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {isEdit ? 'Update Activity' : 'Save Activity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ActivityFormModal;

