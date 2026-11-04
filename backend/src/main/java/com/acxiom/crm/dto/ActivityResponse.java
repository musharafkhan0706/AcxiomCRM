package com.acxiom.crm.dto;

import com.acxiom.crm.entity.Activity;
import com.acxiom.crm.entity.ActivityStatus;
import com.acxiom.crm.entity.ActivityType;

import java.time.Instant;

public class ActivityResponse {
    private Long id;
    private ActivityType activityType;
    private String subject;
    private String description;
    private Instant activityDate;
    private Long customerId;
    private String customerName;
    private Long leadId;
    private String leadName;
    private Long opportunityId;
    private String opportunityName;
    private ActivityStatus status;
    private Long assignedToUserId;
    private String assignedToUserName;
    private Long createdByUserId;
    private String createdByUserName;
    private Instant createdAt;
    private Instant updatedAt;

    public ActivityResponse() {}

    public static ActivityResponse fromEntity(Activity a) {
        ActivityResponse dto = new ActivityResponse();
        dto.setId(a.getId());
        dto.setActivityType(a.getActivityType());
        dto.setSubject(a.getSubject());
        dto.setDescription(a.getDescription());
        dto.setActivityDate(a.getActivityDate());
        if (a.getCustomer() != null) {
            dto.setCustomerId(a.getCustomer().getId());
            dto.setCustomerName(a.getCustomer().getCustomerName());
        }
        if (a.getLead() != null) {
            dto.setLeadId(a.getLead().getId());
            dto.setLeadName(a.getLead().getLeadName());
        }
        if (a.getOpportunity() != null) {
            dto.setOpportunityId(a.getOpportunity().getId());
            dto.setOpportunityName(a.getOpportunity().getOpportunityName());
        }
        dto.setStatus(a.getStatus());
        if (a.getAssignedTo() != null) {
            dto.setAssignedToUserId(a.getAssignedTo().getId());
            dto.setAssignedToUserName(a.getAssignedTo().getName());
        }
        if (a.getCreatedBy() != null) {
            dto.setCreatedByUserId(a.getCreatedBy().getId());
            dto.setCreatedByUserName(a.getCreatedBy().getName());
        }
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ActivityType getActivityType() {
        return activityType;
    }

    public void setActivityType(ActivityType activityType) {
        this.activityType = activityType;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getActivityDate() {
        return activityDate;
    }

    public void setActivityDate(Instant activityDate) {
        this.activityDate = activityDate;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public String getLeadName() {
        return leadName;
    }

    public void setLeadName(String leadName) {
        this.leadName = leadName;
    }

    public Long getOpportunityId() {
        return opportunityId;
    }

    public void setOpportunityId(Long opportunityId) {
        this.opportunityId = opportunityId;
    }

    public String getOpportunityName() {
        return opportunityName;
    }

    public void setOpportunityName(String opportunityName) {
        this.opportunityName = opportunityName;
    }

    public ActivityStatus getStatus() {
        return status;
    }

    public void setStatus(ActivityStatus status) {
        this.status = status;
    }

    public Long getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
    }

    public String getAssignedToUserName() {
        return assignedToUserName;
    }

    public void setAssignedToUserName(String assignedToUserName) {
        this.assignedToUserName = assignedToUserName;
    }

    public Long getCreatedByUserId() {
        return createdByUserId;
    }

    public void setCreatedByUserId(Long createdByUserId) {
        this.createdByUserId = createdByUserId;
    }

    public String getCreatedByUserName() {
        return createdByUserName;
    }

    public void setCreatedByUserName(String createdByUserName) {
        this.createdByUserName = createdByUserName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

