import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Customer, ApiResponse, User } from '../../types';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

const customerSchema = z.object({
  customerName: z.string().min(1, 'Customer Name is required.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  assignedToUserId: z.coerce.number().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, customer }) => {
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();
  const isEdit = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: '',
      email: '',
      phone: '',
      companyName: '',
      address: '',
      city: '',
      state: '',
      status: 'ACTIVE',
      assignedToUserId: undefined,
    },
  });

  // Fetch sales representatives for assignment dropdown
  const { data: users } = useQuery<User[]>({
    queryKey: ['users-assignable'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<User[]>>('/users');
      return res.data.data;
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (customer) {
      reset({
        customerName: customer.customerName,
        email: customer.email,
        phone: customer.phone,
        companyName: customer.companyName || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        status: customer.status,
        assignedToUserId: customer.assignedToUserId,
      });
    } else {
      reset({
        customerName: '',
        email: '',
        phone: '',
        companyName: '',
        address: '',
        city: '',
        state: '',
        status: 'ACTIVE',
        assignedToUserId: undefined,
      });
    }
  }, [customer, reset, isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      if (isEdit) {
        return api.put<ApiResponse<Customer>>(`/customers/${customer.id}`, values);
      } else {
        return api.post<ApiResponse<Customer>>('/customers', values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      success(isEdit ? 'Customer account updated successfully.' : 'New customer registered successfully.');
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to save customer record.';
      toastError(msg);
    },
  });

  const onSubmit = (values: CustomerFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Customer (${customer?.customerCode})` : 'Register New Enterprise Customer'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer / Client Name *"
            placeholder="Acme Corporation Ltd"
            {...register('customerName')}
            error={errors.customerName?.message}
          />
          <Input
            label="Company Name"
            placeholder="Acme Holdings"
            {...register('companyName')}
            error={errors.companyName?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="contact@acme.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Phone Number *"
            placeholder="+1 (555) 234-5678"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <Input
          label="Street Address"
          placeholder="100 Tech Boulevard, Suite 400"
          {...register('address')}
          error={errors.address?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="City" placeholder="San Francisco" {...register('city')} error={errors.city?.message} />
          <Input label="State / Region" placeholder="California" {...register('state')} error={errors.state?.message} />
          <Select
            label="Account Status *"
            {...register('status')}
            error={errors.status?.message}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </div>

        <Select
          label="Assigned Account Executive"
          {...register('assignedToUserId')}
          error={errors.assignedToUserId?.message}
          options={[
            { value: '', label: 'Unassigned (General Pool)' },
            ...(users || []).map((u) => ({
              value: String(u.id),
              label: `${u.name} (${u.role.replace('_', ' ')})`,
            })),
          ]}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            {isEdit ? 'Update Customer' : 'Create Customer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;

