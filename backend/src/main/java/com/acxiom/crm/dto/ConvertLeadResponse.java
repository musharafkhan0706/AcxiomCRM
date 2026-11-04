package com.acxiom.crm.dto;

public class ConvertLeadResponse {
    private LeadResponse lead;
    private CustomerResponse customer;
    private OpportunityResponse opportunity;

    public ConvertLeadResponse() {}

    public ConvertLeadResponse(LeadResponse lead, CustomerResponse customer, OpportunityResponse opportunity) {
        this.lead = lead;
        this.customer = customer;
        this.opportunity = opportunity;
    }

    public LeadResponse getLead() {
        return lead;
    }

    public void setLead(LeadResponse lead) {
        this.lead = lead;
    }

    public CustomerResponse getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerResponse customer) {
        this.customer = customer;
    }

    public OpportunityResponse getOpportunity() {
        return opportunity;
    }

    public void setOpportunity(OpportunityResponse opportunity) {
        this.opportunity = opportunity;
    }
}

