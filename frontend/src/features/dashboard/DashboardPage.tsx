import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Users,
  Target,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { DashboardMetrics, ApiResponse } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import KpiCard from '../../components/common/KpiCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../../utils/cn';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<string>('THIS_MONTH');

  const { data, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', period],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardMetrics>>(`/dashboard?period=${period}`);
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  const getRoleGreeting = () => {
    switch (user?.role) {
      case 'ADMIN':
        return {
          title: 'Executive Enterprise Overview',
          desc: 'Organization-wide real-time sales pipeline, conversion metrics, and system activity.',
        };
      case 'MANAGER':
        return {
          title: 'Sales Team Performance Dashboard',
          desc: 'Monitor team quota attainment, active lead pipeline, and overdue follow-up SLAs.',
        };
      case 'SALES_EXECUTIVE':
        return {
          title: 'My Daily Sales Workspace',
          desc: 'Track your assigned leads, closing opportunities, and today’s client engagements.',
        };
      default:
        return { title: 'CRM Dashboard', desc: 'Welcome back to AcxiomCRM' };
    }
  };

  const greeting = getRoleGreeting();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Could not load dashboard data"
        description="There was an error communicating with the AcxiomCRM backend service."
        icon={AlertTriangle}
      />
    );
  }

  // --- Chart 1: Lead Status Distribution (Doughnut) ---
  const leadDistributionLabels = data.leadStatusDistribution.map((d) => d.status);
  const leadDistributionValues = data.leadStatusDistribution.map((d) => d.count);
  const leadDistributionColors = [
    '#23CED9', // Bright Cyan (NEW)
    '#097C87', // Deep Teal (CONTACTED)
    '#A1CCA6', // Sage Green (QUALIFIED)
    '#F9D779', // Soft Yellow (UNQUALIFIED)
    '#10B981', // Emerald (CONVERTED)
    '#FCA47C', // Warm Peach (LOST)
  ];

  const leadChartData = {
    labels: leadDistributionLabels,
    datasets: [
      {
        data: leadDistributionValues,
        backgroundColor: leadDistributionColors.slice(0, leadDistributionLabels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // --- Chart 2: Opportunity Pipeline by Stage (Bar) ---
  const pipelineLabels = data.opportunityPipeline.map((p) => p.stage);
  const pipelineAmounts = data.opportunityPipeline.map((p) => p.totalAmount);
  const pipelineCounts = data.opportunityPipeline.map((p) => p.count);

  const pipelineChartData = {
    labels: pipelineLabels,
    datasets: [
      {
        label: 'Pipeline Value ($)',
        data: pipelineAmounts,
        backgroundColor: '#097C87', // Deep Teal
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Deal Count',
        data: pipelineCounts,
        backgroundColor: '#23CED9', // Bright Cyan
        borderRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  // --- Chart 3: Monthly Sales Performance (Bar) ---
  const monthlyLabels = data.monthlySalesPerformance.map((m) => m.month);
  const monthlyAmounts = data.monthlySalesPerformance.map((m) => m.wonAmount);
  const monthlyCounts = data.monthlySalesPerformance.map((m) => m.wonCount);

  const monthlyChartData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Won Revenue ($)',
        data: monthlyAmounts,
        backgroundColor: '#A1CCA6', // Sage Green
        borderRadius: 6,
        yAxisID: 'y',
      },
      {
        label: 'Won Deals',
        data: monthlyCounts,
        backgroundColor: '#097C87', // Deep Teal
        borderRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Scope & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-card">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{greeting.title}</h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-brand-deep-teal/10 text-brand-deep-teal border border-brand-deep-teal/20">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{greeting.desc}</p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs whitespace-nowrap">
            {[
              { id: 'TODAY', label: 'Today' },
              { id: 'THIS_WEEK', label: 'Week' },
              { id: 'THIS_MONTH', label: 'Month' },
              { id: 'ALL', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriod(tab.id)}
                aria-pressed={period === tab.id}
                className={`px-3 py-1 font-semibold rounded-md transition-all select-none ${
                  period === tab.id
                    ? 'bg-brand-teal bg-brand-deep-teal text-white shadow-sm hover:bg-brand-teal-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overdue SLA Follow-ups Warning Banner */}
      {data.overdueFollowUpsCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Attention: {data.overdueFollowUpsCount} Follow-Up{data.overdueFollowUpsCount > 1 ? 's are' : ' is'}{' '}
                Overdue!
              </p>
              <p className="text-xs text-amber-700">
                Action required to maintain SLA and prevent customer relationship attrition.
              </p>
            </div>
          </div>
          <Link
            to="/followups?tab=overdue"
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            Review Overdue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Mandatory KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Customers"
          value={data.totalCustomers}
          icon={Users}
          colorVariant="teal"
          subtext="Active client accounts"
        />
        <KpiCard
          title="Total Leads"
          value={data.totalLeads}
          icon={Target}
          colorVariant="cyan"
          subtext={`${data.openLeads} currently open`}
        />
        <KpiCard
          title="Total Pipeline Value"
          value={formatCurrency(data.totalPipelineValue)}
          icon={DollarSign}
          colorVariant="peach"
          subtext={`Weighted: ${formatCurrency(data.weightedPipelineValue)}`}
        />
        <KpiCard
          title="Opportunities"
          value={data.totalOpportunities}
          icon={Briefcase}
          colorVariant="yellow"
          subtext={`${data.openOpportunities} active deals`}
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Won Opportunities</p>
            <p className="text-lg font-bold text-gray-900">{data.wonOpportunities}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Lost Opportunities</p>
            <p className="text-lg font-bold text-gray-900">{data.lostOpportunities}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-brand-deep-teal">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Weighted Forecast</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(data.weightedPipelineValue)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-card flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Overdue Follow-ups</p>
            <p className="text-lg font-bold text-amber-600">{data.overdueFollowUpsCount}</p>
          </div>
        </div>
      </div>

      {/* Mandatory Charts: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Lead Distribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              <span>Lead Status Distribution</span>
              <span className="text-xs font-normal text-gray-500">Pipeline funnel</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            <div className="h-64 w-full flex items-center justify-center">
              {leadDistributionValues.reduce((a, b) => a + b, 0) > 0 ? (
                <Doughnut
                  data={leadChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                    },
                    cutout: '65%',
                  }}
                />
              ) : (
                <p className="text-xs text-gray-400">No lead records available for period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Opportunity Pipeline by Stage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              <span>Opportunity Pipeline by Stage</span>
              <span className="text-xs font-normal text-gray-500">Total deal value & count</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <Bar
                data={pipelineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      type: 'linear',
                      position: 'left',
                      ticks: {
                        callback: (v) => `$${Number(v) / 1000}k`,
                        font: { size: 10 },
                      },
                      grid: { color: '#f3f4f6' },
                    },
                    y1: {
                      type: 'linear',
                      position: 'right',
                      grid: { drawOnChartArea: false },
                      ticks: { precision: 0, font: { size: 10 } },
                    },
                    x: {
                      grid: { display: false },
                      ticks: { font: { size: 10 } },
                    },
                  },
                  plugins: {
                    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart 3: Monthly Sales Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
            <span>Monthly Sales Performance</span>
            <span className="text-xs font-normal text-gray-500">Trailing won contracts and revenue</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <Bar
              data={monthlyChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    type: 'linear',
                    position: 'left',
                    ticks: {
                      callback: (v) => `$${Number(v) / 1000}k`,
                      font: { size: 10 },
                    },
                    grid: { color: '#f3f4f6' },
                  },
                  y1: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { precision: 0, font: { size: 10 } },
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 } },
                  },
                },
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Widgets: Upcoming Follow-ups & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Follow-ups */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-deep-teal" />
              <span>Upcoming Client Follow-ups</span>
            </CardTitle>
            <Link to="/followups" className="text-xs font-semibold text-brand-deep-teal hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.upcomingFollowUps && data.upcomingFollowUps.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.upcomingFollowUps.map((fu) => (
                  <div key={fu.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{fu.subject}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fu.customerName || fu.leadName || 'General'} • {fu.followUpType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-brand-deep-teal">{formatDate(fu.followUpDate)}</p>
                      <StatusBadge status={fu.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">No upcoming follow-ups scheduled</div>
            )}
          </CardContent>
        </Card>

        {/* Top Active Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-deep-teal" />
              <span>Top Pipeline Opportunities</span>
            </CardTitle>
            <Link to="/opportunities" className="text-xs font-semibold text-brand-deep-teal hover:underline flex items-center gap-1">
              View pipeline <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.topOpportunities && data.topOpportunities.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {data.topOpportunities.map((op) => (
                  <div key={op.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{op.opportunityName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {op.customerName} • Close: {formatDate(op.expectedCloseDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(op.amount)}</p>
                      <StatusBadge status={op.stage} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-400">No active opportunities in pipeline</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

