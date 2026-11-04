export type RoleName = 'ADMIN' | 'MANAGER' | 'SALES_EXECUTIVE';

export interface User {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  roleDescription?: string;
  department?: string;
  active: boolean;
  failedLoginCount: number;
  locked: boolean;
  lockoutTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  name: string;
  email: string;
  role: RoleName;
  department?: string;
}

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface Customer {
  id: number;
  customerCode: string;
  customerName: string;
  email: string;
  phone: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  status: CustomerStatus;
  assignedToUserId?: number;
  assignedToUserName?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED' | 'LOST';
export type LeadSource = 'WEBSITE' | 'REFERRAL' | 'COLD_CALL' | 'CAMPAIGN' | 'PARTNER' | 'OTHER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Lead {
  id: number;
  leadCode: string;
  leadName: string;
  email: string;
  phone: string;
  companyName?: string;
  source: LeadSource;
  status: LeadStatus;
  expectedValue: number;
  priority: Priority;
  assignedToUserId?: number;
  assignedToUserName?: string;
  convertedCustomerId?: number;
  convertedCustomerName?: string;
  convertedOpportunityId?: number;
  convertedAt?: string;
  notes?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export type OpportunityStage = 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export interface Opportunity {
  id: number;
  opportunityName: string;
  customerId: number;
  customerName?: string;
  leadId?: number;
  leadName?: string;
  amount: number;
  stage: OpportunityStage;
  probability: number;
  expectedCloseDate: string;
  status: OpportunityStatus;
  weightedPipeline: number;
  assignedToUserId?: number;
  assignedToUserName?: string;
  source?: string;
  notes?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export type FollowUpType = 'CALL' | 'MEETING' | 'EMAIL' | 'DEMO';
export type FollowUpStatus = 'PLANNED' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
export type RelatedType = 'CUSTOMER' | 'LEAD' | 'OPPORTUNITY';

export interface FollowUp {
  id: number;
  relatedType: RelatedType;
  customerId?: number;
  customerName?: string;
  leadId?: number;
  leadName?: string;
  opportunityId?: number;
  opportunityName?: string;
  followUpDate: string;
  subject: string;
  followUpType: FollowUpType;
  status: FollowUpStatus;
  assignedToUserId?: number;
  assignedToUserName?: string;
  notes?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'CALL' | 'MEETING' | 'EMAIL' | 'TASK';
export type ActivityStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export interface Activity {
  id: number;
  activityType: ActivityType;
  subject: string;
  description?: string;
  activityDate: string;
  customerId?: number;
  customerName?: string;
  leadId?: number;
  leadName?: string;
  opportunityId?: number;
  opportunityName?: string;
  status: ActivityStatus;
  assignedToUserId?: number;
  assignedToUserName?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  userId?: number;
  username?: string;
  action: string;
  entityName: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  result: string;
  details?: string;
  ipAddress?: string;
}

export interface Customer360 {
  customer: Customer;
  leads: Lead[];
  opportunities: Opportunity[];
  followUps: FollowUp[];
  activities: Activity[];
  history: AuditLog[];
}

export interface LeadStatusSummary {
  status: LeadStatus;
  count: number;
}

export interface StageSummary {
  stage: OpportunityStage;
  count: number;
  totalAmount: number;
}

export interface MonthlySales {
  month: string;
  wonAmount: number;
  wonCount: number;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalLeads: number;
  openLeads: number;
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  overdueFollowUpsCount: number;
  leadStatusDistribution: LeadStatusSummary[];
  opportunityPipeline: StageSummary[];
  monthlySalesPerformance: MonthlySales[];
  recentActivities: Activity[];
  upcomingFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
  recentLeads: Lead[];
  topOpportunities: Opportunity[];
}

export interface PipelineSummary {
  totalAmount: number;
  totalWeightedAmount: number;
  totalOpportunities: number;
  openOpportunities: number;
  wonOpportunities: number;
  lostOpportunities: number;
  wonAmount: number;
  lostAmount: number;
  stages: Record<OpportunityStage, StageSummary>;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string>;
  timestamp: string;
}

