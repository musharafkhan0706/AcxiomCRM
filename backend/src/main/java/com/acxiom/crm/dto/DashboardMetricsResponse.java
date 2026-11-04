package com.acxiom.crm.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardMetricsResponse {
    // KPI Cards
    private long totalCustomers;
    private long totalLeads;
    private long openLeads;
    private long totalOpportunities;
    private long openOpportunities;
    private long wonOpportunities;
    private long lostOpportunities;
    private BigDecimal totalPipelineValue;
    private BigDecimal weightedPipelineValue;
    private long overdueFollowUpsCount;

    // Chart Data
    private List<LeadStatusSummaryDto> leadStatusDistribution;
    private List<StageSummaryDto> opportunityPipeline;
    private List<MonthlySalesDto> monthlySalesPerformance;

    // Quick Activity / Task Widgets
    private List<ActivityResponse> recentActivities;
    private List<FollowUpResponse> upcomingFollowUps;
    private List<FollowUpResponse> overdueFollowUps;
    private List<LeadResponse> recentLeads;
    private List<OpportunityResponse> topOpportunities;

    public DashboardMetricsResponse() {}

    public long getTotalCustomers() {
        return totalCustomers;
    }

    public void setTotalCustomers(long totalCustomers) {
        this.totalCustomers = totalCustomers;
    }

    public long getTotalLeads() {
        return totalLeads;
    }

    public void setTotalLeads(long totalLeads) {
        this.totalLeads = totalLeads;
    }

    public long getOpenLeads() {
        return openLeads;
    }

    public void setOpenLeads(long openLeads) {
        this.openLeads = openLeads;
    }

    public long getTotalOpportunities() {
        return totalOpportunities;
    }

    public void setTotalOpportunities(long totalOpportunities) {
        this.totalOpportunities = totalOpportunities;
    }

    public long getOpenOpportunities() {
        return openOpportunities;
    }

    public void setOpenOpportunities(long openOpportunities) {
        this.openOpportunities = openOpportunities;
    }

    public long getWonOpportunities() {
        return wonOpportunities;
    }

    public void setWonOpportunities(long wonOpportunities) {
        this.wonOpportunities = wonOpportunities;
    }

    public long getLostOpportunities() {
        return lostOpportunities;
    }

    public void setLostOpportunities(long lostOpportunities) {
        this.lostOpportunities = lostOpportunities;
    }

    public BigDecimal getTotalPipelineValue() {
        return totalPipelineValue;
    }

    public void setTotalPipelineValue(BigDecimal totalPipelineValue) {
        this.totalPipelineValue = totalPipelineValue;
    }

    public BigDecimal getWeightedPipelineValue() {
        return weightedPipelineValue;
    }

    public void setWeightedPipelineValue(BigDecimal weightedPipelineValue) {
        this.weightedPipelineValue = weightedPipelineValue;
    }

    public long getOverdueFollowUpsCount() {
        return overdueFollowUpsCount;
    }

    public void setOverdueFollowUpsCount(long overdueFollowUpsCount) {
        this.overdueFollowUpsCount = overdueFollowUpsCount;
    }

    public List<LeadStatusSummaryDto> getLeadStatusDistribution() {
        return leadStatusDistribution;
    }

    public void setLeadStatusDistribution(List<LeadStatusSummaryDto> leadStatusDistribution) {
        this.leadStatusDistribution = leadStatusDistribution;
    }

    public List<StageSummaryDto> getOpportunityPipeline() {
        return opportunityPipeline;
    }

    public void setOpportunityPipeline(List<StageSummaryDto> opportunityPipeline) {
        this.opportunityPipeline = opportunityPipeline;
    }

    public List<MonthlySalesDto> getMonthlySalesPerformance() {
        return monthlySalesPerformance;
    }

    public void setMonthlySalesPerformance(List<MonthlySalesDto> monthlySalesPerformance) {
        this.monthlySalesPerformance = monthlySalesPerformance;
    }

    public List<ActivityResponse> getRecentActivities() {
        return recentActivities;
    }

    public void setRecentActivities(List<ActivityResponse> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public List<FollowUpResponse> getUpcomingFollowUps() {
        return upcomingFollowUps;
    }

    public void setUpcomingFollowUps(List<FollowUpResponse> upcomingFollowUps) {
        this.upcomingFollowUps = upcomingFollowUps;
    }

    public List<FollowUpResponse> getOverdueFollowUps() {
        return overdueFollowUps;
    }

    public void setOverdueFollowUps(List<FollowUpResponse> overdueFollowUps) {
        this.overdueFollowUps = overdueFollowUps;
    }

    public List<LeadResponse> getRecentLeads() {
        return recentLeads;
    }

    public void setRecentLeads(List<LeadResponse> recentLeads) {
        this.recentLeads = recentLeads;
    }

    public List<OpportunityResponse> getTopOpportunities() {
        return topOpportunities;
    }

    public void setTopOpportunities(List<OpportunityResponse> topOpportunities) {
        this.topOpportunities = topOpportunities;
    }
}

