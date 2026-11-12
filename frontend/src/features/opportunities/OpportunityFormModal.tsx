import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Opportunity, ApiResponse, User, Customer, OpportunityStage } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { normalizeUsersList } from '../../utils/normalize';

const todayString = new Date().toISOString().split('T')[0];

const opportunitySchema = z.object({
  opportunityName: z.string().min(1, 'Opportunity Name is required.'),
  customerId: z.coerce.number().min(1, 'Please select a Customer Account.'),
  amount: z.coerce.number().min(0.01, 'Deal amount must be greater than 0.'),
  stage: z.enum(['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).default('QUALIFICATION'),
  probability: z.coerce.number().min(0, 'Probability cannot be negative.').max(100, 'Probability cannot exceed 100%.'),
  expectedCloseDate: z.string().min(1, 'Target close date is required.').refine((date) => date >= todayString, {
    message: 'Expected close date must be today or in the future.',
  }),
  assignedToUserId: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val)) || Number(val) <= 0 ? undefined : Number(val)),
    z.number().optional()
  ),
  notes: z.string().optional(),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface OpportunityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity?: Opportunity | null;
}

export const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({ isOpen, onClose, opportunity }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!opportunity;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      opportunityName: '',
      customerId: undefined,
      amount: 10000,
      stage: 'QUALIFICATION',
      probability: 20,
      expectedCloseDate: todayString,
      assignedToUserId: undefined,
      notes: '',
    },
  });

  // Watch stage changes to automatically suggest default probability
  const currentStage = watch('stage');
  useEffect(() => {
    if (!opportunity) {
      const defaultProbabilities: Record<OpportunityStage, number> = {
        QUALIFICATION: 20,
        PROPOSAL: 50,
        NEGOTIATION: 80,
        WON: 100,
        LOST: 0,
      };
      if (defaultProbabilities[currentStage] !== undefined) {
        setValue('probability', defaultProbabilities[currentStage]);
      }
    }
  }, [currentStage, opportunity, setValue]);

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
    if (opportunity) {
      reset({
        opportunityName: opportunity.opportunityName,
        customerId: opportunity.customerId,
        amount: opportunity.amount,
        stage: opportunity.stage,
        probability: opportunity.probability,
        expectedCloseDate: opportunity.expectedCloseDate,
        assignedToUserId: opportunity.assignedToUserId ? Number(opportunity.assignedToUserId) : undefined,
        notes: opportunity.notes || '',
      });
    } else {
      reset({
        opportunityName: '',
        customerId: undefined,
        amount: 10000,
        stage: 'QUALIFICATION',
        probability: 20,
        expectedCloseDate: todayString,
        assignedToUserId: undefined,
        notes: '',
      });
    }
  }, [opportunity, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: OpportunityFormValues) => {
      if (isEdit) {
        return api.put<ApiResponse<Opportunity>>(`/opportunities/${opportunity.id}`, values);
      } else {
        return api.post<ApiResponse<Opportunity>>('/opportunities', values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success(isEdit ? 'Opportunity updated successfully.' : 'New opportunity added to pipeline.');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to save opportunity.');
    },
  });

  const onSubmit = (values: OpportunityFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Opportunity: ${opportunity?.opportunityName}` : 'Add New Sales Opportunity'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Opportunity / Deal Name *"
          placeholder="e.g. Acme Enterprise ERP Migration"
          {...register('opportunityName')}
          error={errors.opportunityName?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Customer Account *"
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

          <Input
            label="Deal Amount ($) *"
            type="number"
            step="0.01"
            placeholder="50000"
            {...register('amount')}
            error={errors.amount?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Pipeline Stage *"
            {...register('stage')}
            error={errors.stage?.message}
            options={[
              { value: 'QUALIFICATION', label: '1. Qualification' },
              { value: 'PROPOSAL', label: '2. Proposal' },
              { value: 'NEGOTIATION', label: '3. Negotiation' },
              { value: 'WON', label: '4. Closed Won' },
              { value: 'LOST', label: '5. Closed Lost' },
            ]}
          />

          <Input
            label="Win Probability (%) *"
            type="number"
            min="0"
            max="100"
            {...register('probability')}
            error={errors.probability?.message}
          />

          <Input
            label="Target Close Date *"
            type="date"
            {...register('expectedCloseDate')}
            error={errors.expectedCloseDate?.message}
          />
        </div>

        {(() => {
          const currentAssignedId = opportunity?.assignedToUserId ? Number(opportunity.assignedToUserId) : undefined;
          const assignedExists = currentAssignedId ? users.some((u) => u.id === currentAssignedId) : false;
          const userOptions = [
            { value: '', label: 'Unassigned' },
            ...(!assignedExists && currentAssignedId
              ? [{
                  value: String(currentAssignedId),
                  label: opportunity?.assignedToUserName
                    ? `${opportunity.assignedToUserName} (Currently Assigned)`
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
              label="Deal Owner (Assigned Representative)"
              {...register('assignedToUserId')}
              error={errors.assignedToUserId?.message}
              options={userOptions}
              disabled={isLoadingUsers}
            />
          );
        })()}

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Deal Strategy & Notes</label>
          <textarea
            rows={3}
            placeholder="Key drivers, competitive landscape, procurement schedule..."
            {...register('notes')}
            className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {isEdit ? 'Update Deal' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OpportunityFormModal;

