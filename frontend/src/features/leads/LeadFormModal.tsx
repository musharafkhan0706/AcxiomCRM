import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Lead, ApiResponse, User, LeadSource, LeadStatus, Priority } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const leadSchema = z.object({
  leadName: z.string().min(1, 'Lead Name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  companyName: z.string().optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'COLD_CALL', 'CAMPAIGN', 'PARTNER', 'OTHER']),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED', 'LOST']).default('NEW'),
  expectedValue: z.coerce.number().min(0, 'Expected value must be 0 or greater.'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  assignedToUserId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ isOpen, onClose, lead }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!lead;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      leadName: '',
      email: '',
      phone: '',
      companyName: '',
      source: 'WEBSITE',
      status: 'NEW',
      expectedValue: 0,
      priority: 'MEDIUM',
      assignedToUserId: undefined,
      notes: '',
    },
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
    if (lead) {
      reset({
        leadName: lead.leadName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName || '',
        source: lead.source,
        status: lead.status,
        expectedValue: lead.expectedValue,
        priority: lead.priority,
        assignedToUserId: lead.assignedToUserId,
        notes: lead.notes || '',
      });
    } else {
      reset({
        leadName: '',
        email: '',
        phone: '',
        companyName: '',
        source: 'WEBSITE',
        status: 'NEW',
        expectedValue: 0,
        priority: 'MEDIUM',
        assignedToUserId: undefined,
        notes: '',
      });
    }
  }, [lead, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: LeadFormValues) => {
      if (isEdit) {
        return api.put<ApiResponse<Lead>>(`/leads/${lead.id}`, values);
      } else {
        return api.post<ApiResponse<Lead>>('/leads', values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success(isEdit ? 'Lead record updated successfully.' : 'New sales lead created successfully.');
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to save lead record.';
      toastError(msg);
    },
  });

  const onSubmit = (values: LeadFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Lead (${lead?.leadCode})` : 'Capture New Sales Lead'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Lead / Prospect Name *"
            placeholder="Johnathan Davis"
            {...register('leadName')}
            error={errors.leadName?.message}
          />
          <Input
            label="Company / Organization"
            placeholder="Apex Global Inc"
            {...register('companyName')}
            error={errors.companyName?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="jdavis@apex.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Phone Number *"
            placeholder="+1 (555) 345-6789"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Lead Source *"
            {...register('source')}
            error={errors.source?.message}
            options={[
              { value: 'WEBSITE', label: 'Website Inbound' },
              { value: 'REFERRAL', label: 'Client Referral' },
              { value: 'COLD_CALL', label: 'Cold Outreach' },
              { value: 'CAMPAIGN', label: 'Marketing Campaign' },
              { value: 'PARTNER', label: 'Channel Partner' },
              { value: 'OTHER', label: 'Other Source' },
            ]}
          />

          <Select
            label="Status *"
            {...register('status')}
            error={errors.status?.message}
            options={[
              { value: 'NEW', label: 'New' },
              { value: 'CONTACTED', label: 'Contacted' },
              { value: 'QUALIFIED', label: 'Qualified' },
              { value: 'UNQUALIFIED', label: 'Unqualified' },
              { value: 'CONVERTED', label: 'Converted' },
              { value: 'LOST', label: 'Lost' },
            ]}
          />

          <Select
            label="Priority Level *"
            {...register('priority')}
            error={errors.priority?.message}
            options={[
              { value: 'LOW', label: 'Low Priority' },
              { value: 'MEDIUM', label: 'Medium Priority' },
              { value: 'HIGH', label: 'High Priority' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Expected Deal Value ($)"
            type="number"
            step="0.01"
            placeholder="25000"
            {...register('expectedValue')}
            error={errors.expectedValue?.message}
          />

          <Select
            label="Assigned Sales Representative"
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
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Discovery Notes</label>
          <textarea
            rows={3}
            placeholder="Notes on client requirements, budget timeline, and decision makers..."
            {...register('notes')}
            className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-deep-teal/20 focus:border-brand-deep-teal"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {isEdit ? 'Update Lead' : 'Create Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LeadFormModal;

