package com.acxiom.crm.dto;

import java.util.List;

public class Customer360Response {
    private CustomerResponse customer;
    private List<LeadResponse> leads;
    private List<OpportunityResponse> opportunities;
    private List<FollowUpResponse> followUps;
    private List<ActivityResponse> activities;
    private List<AuditLogResponse> history;

    public Customer360Response() {}

    public Customer360Response(CustomerResponse customer, List<LeadResponse> leads,
                               List<OpportunityResponse> opportunities, List<FollowUpResponse> followUps,
                               List<ActivityResponse> activities, List<AuditLogResponse> history) {
        this.customer = customer;
        this.leads = leads;
        this.opportunities = opportunities;
        this.followUps = followUps;
        this.activities = activities;
        this.history = history;
    }

    public CustomerResponse getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerResponse customer) {
        this.customer = customer;
    }

    public List<LeadResponse> getLeads() {
        return leads;
    }

    public void setLeads(List<LeadResponse> leads) {
        this.leads = leads;
    }

    public List<OpportunityResponse> getOpportunities() {
        return opportunities;
    }

    public void setOpportunities(List<OpportunityResponse> opportunities) {
        this.opportunities = opportunities;
    }

    public List<FollowUpResponse> getFollowUps() {
        return followUps;
    }

    public void setFollowUps(List<FollowUpResponse> followUps) {
        this.followUps = followUps;
    }

    public List<ActivityResponse> getActivities() {
        return activities;
    }

    public void setActivities(List<ActivityResponse> activities) {
        this.activities = activities;
    }

    public List<AuditLogResponse> getHistory() {
        return history;
    }

    public void setHistory(List<AuditLogResponse> history) {
        this.history = history;
    }
}

