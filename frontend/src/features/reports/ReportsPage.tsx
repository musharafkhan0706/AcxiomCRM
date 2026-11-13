import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Target,
  Users,
  CalendarCheck,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../../api/client';
import { ApiResponse } from '../../types';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/cn';

const escapeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '';
  let str = String(val);

  // Treat values beginning with =, +, -, or @ (including leading whitespace)
  // as potentially executable spreadsheet formulas and prepend a tab character to force text rendering
  if (/^\s*[=+\-@]/.test(str)) {
    str = `\t${str}`;
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const getFollowUpRelatedInfo = (fu: any) => {
  if (fu.relatedType === 'CUSTOMER' || (!fu.relatedType && fu.customerName)) {
    return { name: fu.customerName || '—', label: fu.customerName ? 'Customer' : '' };
  }
  if (fu.relatedType === 'LEAD' || (!fu.relatedType && fu.leadName)) {
    return { name: fu.leadName || '—', label: fu.leadName ? 'Lead' : '' };
  }
  if (fu.relatedType === 'OPPORTUNITY' || (!fu.relatedType && fu.opportunityName)) {
    return { name: fu.opportunityName || '—', label: fu.opportunityName ? 'Deal' : '' };
  }
  const fallback = fu.customerName || fu.leadName || fu.opportunityName;
  return { name: fallback || '—', label: '' };
};

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'pipeline' | 'leads' | 'customers' | 'conversions' | 'followups'>(
    'pipeline'
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch report data based on active tab
  const { data, isLoading } = useQuery<any>({
    queryKey: ['report', activeReport, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());

      const res = await api.get<ApiResponse<any>>(`/reports/${activeReport}?${params.toString()}`);
      return res.data.data;
    },
  });

  const exportCsv = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `${activeReport}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeReport === 'pipeline' && data.stages) {
      csvContent += 'Stage,Count,Total Amount\n';
      Object.keys(data.stages).forEach((stage) => {
        const item = data.stages[stage];
        csvContent += `${stage},${item.count},${item.totalAmount}\n`;
      });
    } else if (activeReport === 'leads' && data.bySource) {
      csvContent += 'Category,Metric,Value\n';
      csvContent += `Summary,Total Leads,${data.totalLeads || 0}\n`;
      csvContent += `Summary,Qualified Leads,${data.qualifiedLeads || 0}\n`;
      csvContent += `Summary,Conversion Rate,${data.conversionRate || 0}%\n`;
      Object.entries(data.bySource || {}).forEach(([source, count]) => {
        csvContent += `Lead Source,${source},${count}\n`;
      });
      Object.entries(data.byStatus || {}).forEach(([status, count]) => {
        csvContent += `Lead Status,${status},${count}\n`;
      });
    } else if (activeReport === 'conversions') {
      csvContent += 'Metric,Value\n';
      csvContent += `Total Leads,${data.totalLeads || 0}\n`;
      csvContent += `Converted Leads,${data.convertedLeads || 0}\n`;
      csvContent += `Conversion Rate,${data.conversionRate || 0}%\n`;
      csvContent += `Total Converted Opportunity Value,${data.convertedOpportunityValue || 0}\n`;
    } else if (activeReport === 'customers') {
      const headers = [
        'Customer Code',
        'Customer Name',
        'Company Name',
        'Email',
        'Phone',
        'Address',
        'City',
        'State',
        'Status',
        'Assigned To',
        'Created By',
        'Created Date',
      ];
      csvContent += headers.map(escapeCsvCell).join(',') + '\n';

      const customers: any[] = Array.isArray(data.customers) ? data.customers : [];
      customers.forEach((c) => {
        const row = [
          c.customerCode,
          c.customerName,
          c.companyName,
          c.email,
          c.phone,
          c.address,
          c.city,
          c.state,
          c.status,
          c.assignedToUserName,
          c.createdByUserName,
          c.createdAt ? formatDate(c.createdAt) : '',
        ];
        csvContent += row.map(escapeCsvCell).join(',') + '\n';
      });
    } else if (activeReport === 'followups') {
      const headers = [
        'Subject',
        'Related Type',
        'Related To',
        'Follow-Up Date',
        'Follow-Up Type',
        'Status',
        'Assigned To',
        'Created By',
        'Notes',
        'Created Date',
      ];
      csvContent += headers.map(escapeCsvCell).join(',') + '\n';

      const followUps: any[] = Array.isArray(data.followUps) ? data.followUps : [];
      followUps.forEach((fu) => {
        const related = getFollowUpRelatedInfo(fu);
        const row = [
          fu.subject,
          fu.relatedType,
          related.name !== '—' ? related.name : '',
          fu.followUpDate ? formatDate(fu.followUpDate) : '',
          fu.followUpType,
          fu.status,
          fu.assignedToUserName,
          fu.createdByUserName,
          fu.notes,
          fu.createdAt ? formatDate(fu.createdAt) : '',
        ];
        csvContent += row.map(escapeCsvCell).join(',') + '\n';
      });
    } else {
      // General map serialization
      csvContent += 'Key,Value\n';
      Object.entries(data).forEach(([key, val]) => {
        if (typeof val === 'object') {
          Object.entries(val as object).forEach(([k, v]) => {
            csvContent += `${key} - ${k},${v}\n`;
          });
        } else {
          csvContent += `${key},${val}\n`;
        }
      });
    }

    const encodedUri = encodeURI(csvContent).replace(/#/g, '%23');
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Executive Reports & Business Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate role-scoped audit extracts, pipeline stage analysis, and conversion velocity reports.
          </p>
        </div>
        <Button onClick={exportCsv} variant="primary" className="flex items-center justify-center gap-2 w-full sm:w-auto" disabled={!data}>
          <FileSpreadsheet className="w-4 h-4" /> Export CSV Extract
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto max-w-full text-xs font-semibold">
        {[
          { id: 'pipeline', label: 'Sales Pipeline Summary', icon: DollarSign },
          { id: 'leads', label: 'Lead Sourcing & Status', icon: Target },
          { id: 'conversions', label: 'Conversion Velocity', icon: TrendingUp },
          { id: 'customers', label: 'Customer Acquisition', icon: Users },
          { id: 'followups', label: 'SLA & Engagement Compliance', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReport(tab.id as any)}
              aria-pressed={activeReport === tab.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 select-none ${
                activeReport === tab.id
                  ? 'bg-brand-teal bg-brand-deep-teal text-white shadow-sm hover:bg-brand-teal-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 border border-gray-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${activeReport === tab.id ? 'text-white' : 'text-gray-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Row: Start Date & End Date */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-700">Filter Range:</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-gray-500">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-deep-teal w-full sm:w-auto"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-gray-500">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-deep-teal w-full sm:w-auto"
          />
        </div>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            Clear Dates
          </Button>
        )}
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="p-8 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : !data ? (
        <EmptyState
          title="No analytics data available"
          description="Try broadening the selected date range."
          icon={BarChart3}
        />
      ) : activeReport === 'pipeline' ? (
        <div className="space-y-6">
          {/* Pipeline Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Total Pipeline Value</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(data.totalAmount || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Weighted Forecast</p>
              <p className="text-xl font-bold text-brand-deep-teal mt-1">
                {formatCurrency(data.totalWeightedAmount || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Closed Won Revenue</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(data.wonAmount || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Active Deals Count</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{data.openOpportunities || 0}</p>
            </div>
          </div>

          {/* Pipeline Stages Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-900">Stage Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 text-xs overflow-x-auto min-w-0">
                <div className="grid grid-cols-3 p-3 bg-gray-50 font-bold text-gray-600 min-w-[280px]">
                  <span>Pipeline Stage</span>
                  <span>Deal Count</span>
                  <span className="text-right">Stage Total Value</span>
                </div>
                {data.stages &&
                  Object.entries(data.stages).map(([stage, info]: any) => (
                    <div key={stage} className="grid grid-cols-3 p-3 items-center hover:bg-gray-50/50 min-w-[280px]">
                      <span className="font-semibold text-gray-800">{stage}</span>
                      <span className="text-gray-600">{info.count} deals</span>
                      <span className="text-right font-bold text-gray-900">{formatCurrency(info.totalAmount)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : activeReport === 'conversions' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Total Captured Leads</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{data.totalLeads || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Successfully Converted</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{data.convertedLeads || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Conversion Win Rate</p>
              <p className="text-xl font-bold text-brand-deep-teal mt-1">{data.conversionRate || 0}%</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Generated Deal Value</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {formatCurrency(data.convertedOpportunityValue || 0)}
              </p>
            </div>
          </div>
        </div>
      ) : activeReport === 'leads' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Total Inbound Leads</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{data.totalLeads || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Qualified Leads</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{data.qualifiedLeads || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Pipeline Value from Leads</p>
              <p className="text-xl font-bold text-brand-deep-teal mt-1">
                {formatCurrency(data.totalExpectedValue || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-gray-900">Leads by Channel Source</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 text-xs">
                  {data.bySource &&
                    Object.entries(data.bySource).map(([source, count]: any) => (
                      <div key={source} className="flex items-center justify-between p-3">
                        <span className="font-semibold text-gray-800">{source}</span>
                        <span className="font-bold text-brand-deep-teal">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-gray-900">Leads by Funnel Status</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100 text-xs">
                  {data.byStatus &&
                    Object.entries(data.byStatus).map(([status, count]: any) => (
                      <div key={status} className="flex items-center justify-between p-3">
                        <span className="font-semibold text-gray-800">{status}</span>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : activeReport === 'customers' ? (
        <div className="space-y-6">
          {/* Customer Acquisition Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Total Customers</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{data.totalCustomers || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Active Accounts</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{data.activeCustomers || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Inactive Accounts</p>
              <p className="text-xl font-bold text-gray-500 mt-1">{data.inactiveCustomers || 0}</p>
            </div>
          </div>

          {/* Customer Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-900">
                Customer Acquisition Records ({Array.isArray(data.customers) ? data.customers.length : 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!data.customers || !Array.isArray(data.customers) || data.customers.length === 0 ? (
                <EmptyState
                  title="No customer records found"
                  description="No customer accounts match the selected reporting range."
                  icon={Users}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Customer Code</TableHead>
                      <TableHead className="whitespace-nowrap">Customer Name</TableHead>
                      <TableHead className="whitespace-nowrap">Company</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                      <TableHead className="whitespace-nowrap">Phone</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Assigned To</TableHead>
                      <TableHead className="whitespace-nowrap">Created Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.customers.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs font-semibold text-brand-deep-teal">
                          {c.customerCode || '—'}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 text-xs">
                          {c.customerName || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {c.companyName || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {c.email || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-600">
                          {c.phone || '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={c.status || 'ACTIVE'} />
                        </TableCell>
                        <TableCell className="text-xs text-gray-700">
                          {c.assignedToUserName || <span className="text-gray-400 italic">Unassigned</span>}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(c.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : activeReport === 'followups' ? (
        <div className="space-y-6">
          {/* SLA & Engagement Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Total Follow-Ups</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{data.totalFollowUps || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Completed</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{data.completed || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Planned</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{data.planned || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card">
              <p className="text-xs text-gray-500 font-medium">Missed / Overdue</p>
              <p className="text-xl font-bold text-rose-600 mt-1">{data.missed || 0}</p>
            </div>
          </div>

          {/* Follow-Up Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-gray-900">
                Follow-Up & Engagement Records ({Array.isArray(data.followUps) ? data.followUps.length : 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!data.followUps || !Array.isArray(data.followUps) || data.followUps.length === 0 ? (
                <EmptyState
                  title="No follow-up records found"
                  description="No scheduled or logged follow-ups match the selected reporting range."
                  icon={CalendarCheck}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Subject</TableHead>
                      <TableHead className="whitespace-nowrap">Related To</TableHead>
                      <TableHead className="whitespace-nowrap">Follow-Up Date</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap">Assigned To</TableHead>
                      <TableHead className="whitespace-nowrap">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.followUps.map((fu: any) => {
                      const related = getFollowUpRelatedInfo(fu);
                      return (
                        <TableRow key={fu.id}>
                          <TableCell className="font-medium text-gray-900 text-xs">
                            {fu.subject || '—'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-700">
                            <span className="font-medium text-gray-900">{related.name}</span>
                            {related.label && (
                              <span className="text-gray-400 text-[11px] ml-1">({related.label})</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-900 whitespace-nowrap">
                            {formatDate(fu.followUpDate)}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {fu.followUpType || '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={fu.status || 'PLANNED'} />
                          </TableCell>
                          <TableCell className="text-xs text-gray-700">
                            {fu.assignedToUserName || <span className="text-gray-400 italic">Unassigned</span>}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 max-w-xs truncate" title={fu.notes || undefined}>
                            {fu.notes || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-gray-900">Report Metrics Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 text-xs">
              {Object.entries(data).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3.5">
                  <span className="font-semibold text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-bold text-gray-900">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;

