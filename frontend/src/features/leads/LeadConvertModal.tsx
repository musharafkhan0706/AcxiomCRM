import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Lead, ApiResponse } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/cn';

const convertSchema = z.object({
  opportunityName: z.string().min(1, 'Opportunity Name is required.'),
  amount: z.coerce.number().min(0.01, 'Deal amount must be greater than 0.'),
  expectedCloseDate: z.string().min(1, 'Target close date is required.'),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

interface LeadConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const LeadConvertModal: React.FC<LeadConvertModalProps> = ({ isOpen, onClose, lead }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  const getDefaultCloseDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConvertFormValues>({
    resolver: zodResolver(convertSchema),
    values: {
      opportunityName: lead ? `${lead.leadName} Enterprise Deal` : '',
      amount: lead?.expectedValue || 10000,
      expectedCloseDate: getDefaultCloseDate(),
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ConvertFormValues) => {
      if (!lead) return;
      return api.post<ApiResponse<any>>(`/leads/${lead.id}/convert`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success('Lead successfully converted into Customer Account & Sales Opportunity!');
      onClose();
    },
    onError: (err: any) => {
      toastError(err.response?.data?.message || 'Failed to convert lead.');
    },
  });

  const onSubmit = (values: ConvertFormValues) => {
    mutation.mutate(values);
  };

  if (!lead) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Convert Qualified Lead: ${lead.leadName}`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 space-y-1">
          <p className="font-semibold text-brand-deep-teal">Lead Conversion Workflow</p>
          <p>
            Converting this lead will automatically establish an active enterprise <strong>Customer Account</strong> and
            initialize a qualified <strong>Sales Opportunity</strong> in your revenue pipeline.
          </p>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs space-y-1">
          <p className="font-medium text-gray-700">Lead: <span className="font-semibold text-gray-900">{lead.leadName}</span> ({lead.companyName || 'No Company'})</p>
          <p className="text-gray-500">Contact: {lead.email} • {lead.phone}</p>
          <p className="text-gray-500">Expected Value: {formatCurrency(lead.expectedValue)}</p>
        </div>

        <Input
          label="New Opportunity Name *"
          placeholder="e.g. Acme Corp Enterprise Platform Expansion"
          {...register('opportunityName')}
          error={errors.opportunityName?.message}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Deal Amount ($) *"
            type="number"
            step="0.01"
            placeholder="50000"
            {...register('amount')}
            error={errors.amount?.message}
          />

          <Input
            label="Expected Close Date *"
            type="date"
            {...register('expectedCloseDate')}
            error={errors.expectedCloseDate?.message}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || mutation.isPending}>
            Confirm Conversion
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LeadConvertModal;

