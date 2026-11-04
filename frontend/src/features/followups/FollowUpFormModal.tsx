import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { FollowUp, ApiResponse, User, Customer, Lead, Opportunity, FollowUpType, RelatedType } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const todayString = new Date().toISOString().split('T')[0];

const followUpSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  followUpType: z.enum(['CALL', 'MEETING', 'EMAIL', 'DEMO']),
  followUpDate: z.string().min(1, 'Date and time is required.'),
  relatedType: z.enum(['CUSTOMER', 'LEAD', 'OPPORTUNITY']),
  customerId: z.coerce.number().optional(),
  leadId: z.coerce.number().optional(),
  opportunityId: z.coerce.number().optional(),
  assignedToUserId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FollowUpFormValues = z.infer<typeof followUpSchema>;

interface FollowUpFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  followUp?: FollowUp | null;
}

export const FollowUpFormModal: React.FC<FollowUpFormModalProps> = ({ isOpen, onClose, followUp }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!followUp;

  // Format current date + 1 hour as local datetime string
  const getInitialDateTime = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      subject: '',
      followUpType: 'CALL',
      followUpDate: getInitialDateTime(),
      relatedType: 'CUSTOMER',
      customerId: undefined,
      leadId: undefined,
      opportunityId: undefined,
      assignedToUserId: undefined,
      notes: '',
    },
  });

  const selectedRelatedType = watch('relatedType');

  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers-all'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Customer[]>>('/customers/all');
      return res.data.data;
    },
    enabled: isOpen && selectedRelatedType === 'CUSTOMER',
  });

  const { data: leads } = useQuery<Lead[]>({
    queryKey: ['leads-all'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ content: Lead[] }>>('/leads?size=100');
      return res.data.data.content;
    },
    enabled: isOpen && selectedRelatedType === 'LEAD',
  });

  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ['opps-all'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ content: Opportunity[] }>>('/opportunities?size=100');
      return res.data.data.content;
    },
    enabled: isOpen && selectedRelatedType === 'OPPORTUNITY',
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users-assignable'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User[]>>('/users');
      return res.data.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (followUp) {
      reset({
        subject: followUp.subject,
        followUpType: followUp.followUpType,
        followUpDate: followUp.followUpDate ? followUp.followUpDate.slice(0, 16) : getInitialDateTime(),
        relatedType: followUp.relatedType,
        customerId: followUp.customerId,
        leadId: followUp.leadId,
        opportunityId: followUp.opportunityId,
        assignedToUserId: followUp.assignedToUserId,
        notes: followUp.notes || '',
      });
    } else {
      reset({
        subject: '',
        followUpType: 'CALL',
        followUpDate: getInitialDateTime(),
        relatedType: 'CUSTOMER',
        customerId: undefined,
        leadId: undefined,
        opportunityId: undefined,
        assignedToUserId: undefined,
        notes: '',
      });
    }
  }, [followUp, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: FollowUpFormValues) => {
      // Ensure ISO string for backend
      const payload = {
        ...values,
        followUpDate: new Date(values.followUpDate).toISOString(),
      };
      if (isEdit) {
        return api.put<ApiResponse<FollowUp>>(`/followups/${followUp.id}`, payload);
      } else {
        return api.post<ApiResponse<FollowUp>>('/followups', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success(isEdit ? 'Follow-up updated successfully.' : 'New follow-up scheduled.');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to schedule follow-up.');
    },
  });

  const onSubmit = (values: FollowUpFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Follow-Up: ${followUp?.subject}` : 'Schedule New Client Follow-Up'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Subject / Agenda *"
          placeholder="e.g. Platform Demo & Security Review with VP Engineering"
          {...register('subject')}
          error={errors.subject?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Follow-Up Type *"
            {...register('followUpType')}
            error={errors.followUpType?.message}
            options={[
              { value: 'CALL', label: 'Phone Call' },
              { value: 'MEETING', label: 'In-Person / Online Meeting' },
              { value: 'EMAIL', label: 'Email Outreach' },
              { value: 'DEMO', label: 'Product Demonstration' },
            ]}
          />

          <Input
            label="Follow-Up Date & Time *"
            type="datetime-local"
            {...register('followUpDate')}
            error={errors.followUpDate?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Related Entity Type *"
            {...register('relatedType')}
            error={errors.relatedType?.message}
            options={[
              { value: 'CUSTOMER', label: 'Customer Account' },
              { value: 'LEAD', label: 'Sales Lead' },
              { value: 'OPPORTUNITY', label: 'Sales Opportunity' },
            ]}
          />

          {selectedRelatedType === 'CUSTOMER' && (
            <Select
              label="Select Customer *"
              {...register('customerId')}
              error={errors.customerId?.message}
              options={[
                { value: '', label: '-- Select Customer --' },
                ...(customers || []).map((c) => ({
                  value: String(c.id),
                  label: `${c.customerName} (${c.customerCode})`,
                })),
              ]}
            />
          )}

          {selectedRelatedType === 'LEAD' && (
            <Select
              label="Select Lead *"
              {...register('leadId')}
              error={errors.leadId?.message}
              options={[
                { value: '', label: '-- Select Lead --' },
                ...(leads || []).map((l) => ({
                  value: String(l.id),
                  label: `${l.leadName} (${l.leadCode})`,
                })),
              ]}
            />
          )}

          {selectedRelatedType === 'OPPORTUNITY' && (
            <Select
              label="Select Opportunity *"
              {...register('opportunityId')}
              error={errors.opportunityId?.message}
              options={[
                { value: '', label: '-- Select Opportunity --' },
                ...(opportunities || []).map((o) => ({
                  value: String(o.id),
                  label: `${o.opportunityName} ($${o.amount})`,
                })),
              ]}
            />
          )}
        </div>

        <Select
          label="Assigned Representative"
          {...register('assignedToUserId')}
          error={errors.assignedToUserId?.message}
          options={[
            { value: '', label: 'Unassigned' },
            ...(users || []).map((u) => ({
              value: String(u.id),
              label: `${u.name} (${u.role.replace('_', ' ')})`,
            })),
          ]}
        />

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Preparation Notes</label>
          <textarea
            rows={3}
            placeholder="Key discussion points, slide decks to prepare, participants..."
            {...register('notes')}
            className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {isEdit ? 'Update Follow-Up' : 'Schedule Follow-Up'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FollowUpFormModal;

