import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Target,
  Calendar,
  Activity as ActivityIcon,
  History,
  Mail,
  Phone,
  Building,
  MapPin,
  User,
  Clock,
} from 'lucide-react';
import api from '../../api/client';
import { Customer360, ApiResponse } from '../../types';
import Modal from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/cn';

interface Customer360ModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number | null;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({ isOpen, onClose, customerId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'opportunities' | 'leads' | 'followups' | 'activities' | 'audit'>('overview');

  const { data, isLoading, error } = useQuery<Customer360>({
    queryKey: ['customer-360', customerId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Customer360>>(`/customers/${customerId}/360`);
      return res.data.data;
    },
    enabled: isOpen && !!customerId,
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        data ? (
          <div className="flex items-center gap-3">
            <span>{data.customer.customerName}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">
              {data.customer.customerCode}
            </span>
            <StatusBadge status={data.customer.status} />
          </div>
        ) : (
          'Customer 360° Profile'
        )
      }
      size="xl"
    >
      {isLoading ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error || !data ? (
        <EmptyState
          title="Failed to load 360° profile"
          description="Could not aggregate customer details, leads, and historical timeline."
        />
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Building },
              { id: 'opportunities', label: `Deals (${data.opportunities.length})`, icon: Briefcase },
              { id: 'leads', label: `Leads (${data.leads.length})`, icon: Target },
              { id: 'followups', label: `Follow-Ups (${data.followUps.length})`, icon: Calendar },
              { id: 'activities', label: `Activities (${data.activities.length})`, icon: ActivityIcon },
              { id: 'audit', label: `Audit Trail (${data.history.length})`, icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-brand-deep-teal text-brand-deep-teal'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Company:</span>
                    <span className="font-semibold">{data.customer.companyName || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Email:</span>
                    <a href={`mailto:${data.customer.email}`} className="text-brand-deep-teal hover:underline font-medium">
                      {data.customer.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Phone:</span>
                    <span className="font-medium">{data.customer.phone}</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Location:</span>
                    <span>
                      {[data.customer.address, data.customer.city, data.customer.state]
                        .filter(Boolean)
                        .join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Assigned Rep:</span>
                    <span className="font-semibold text-gray-900">
                      {data.customer.assignedToUserName || 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-500">Client Since:</span>
                    <span>{formatDate(data.customer.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Aggregated KPI Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-teal-50 border border-teal-100 rounded-lg text-center">
                  <p className="text-xs text-brand-deep-teal font-medium">Active Pipeline Value</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(
                      data.opportunities
                        .filter((o) => o.status === 'OPEN')
                        .reduce((sum, o) => sum + Number(o.amount), 0)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                  <p className="text-xs text-emerald-700 font-medium">Won Revenue</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {formatCurrency(
                      data.opportunities
                        .filter((o) => o.status === 'WON')
                        .reduce((sum, o) => sum + Number(o.amount), 0)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
                  <p className="text-xs text-amber-700 font-medium">Follow-Up Tasks</p>
                  <p className="text-lg font-bold text-amber-900">{data.followUps.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Opportunities */}
          {activeTab === 'opportunities' && (
            <div className="space-y-3">
              {data.opportunities.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6">No opportunities created for this customer.</p>
              ) : (
                <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                  {data.opportunities.map((opp) => (
                    <div key={opp.id} className="p-3 bg-white flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{opp.opportunityName}</p>
                        <p className="text-xs text-gray-500">
                          Close Date: {formatDate(opp.expectedCloseDate)} • Prob: {opp.probability}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(opp.amount)}</p>
                        <StatusBadge status={opp.stage} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Leads */}
          {activeTab === 'leads' && (
            <div className="space-y-3">
              {data.leads.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6">No lead inquiries linked to this client.</p>
              ) : (
                <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                  {data.leads.map((l) => (
                    <div key={l.id} className="p-3 bg-white flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{l.leadName}</p>
                        <p className="text-xs text-gray-500">
                          Source: {l.source} • Value: {formatCurrency(l.expectedValue)}
                        </p>
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Follow-Ups */}
          {activeTab === 'followups' && (
            <div className="space-y-3">
              {data.followUps.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6">No follow-ups recorded.</p>
              ) : (
                <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                  {data.followUps.map((fu) => (
                    <div key={fu.id} className="p-3 bg-white flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{fu.subject}</p>
                        <p className="text-xs text-gray-500">
                          Type: {fu.followUpType} • Date: {formatDate(fu.followUpDate)}
                        </p>
                        {fu.notes && <p className="text-xs text-gray-600 mt-1 italic">Notes: {fu.notes}</p>}
                      </div>
                      <StatusBadge status={fu.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Activities */}
          {activeTab === 'activities' && (
            <div className="space-y-3">
              {data.activities.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6">No client activities logged.</p>
              ) : (
                <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                  {data.activities.map((act) => (
                    <div key={act.id} className="p-3 bg-white flex items-center justify-between text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{act.subject}</p>
                        <p className="text-xs text-gray-500">
                          {act.activityType} • {formatDate(act.activityDate)}
                        </p>
                        {act.description && <p className="text-xs text-gray-600 mt-1">{act.description}</p>}
                      </div>
                      <StatusBadge status={act.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Audit Trail */}
          {activeTab === 'audit' && (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {data.history.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-6">No audit records found.</p>
              ) : (
                <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden text-xs">
                  {data.history.map((h) => (
                    <div key={h.id} className="p-3 bg-white flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {h.action} by <span className="text-brand-deep-teal">{h.username || 'System'}</span>
                        </p>
                        <p className="text-gray-500">{h.details || 'Customer record operation'}</p>
                      </div>
                      <span className="text-gray-400">{formatDate(h.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default Customer360Modal;

