package com.acxiom.crm.dto;

import com.acxiom.crm.entity.FollowUp;
import com.acxiom.crm.entity.FollowUpStatus;
import com.acxiom.crm.entity.FollowUpType;
import com.acxiom.crm.entity.RelatedType;

import java.time.Instant;

public class FollowUpResponse {
    private Long id;
    private RelatedType relatedType;
    private Long customerId;
    private String customerName;
    private Long leadId;
    private String leadName;
    private Long opportunityId;
    private String opportunityName;
    private Instant followUpDate;
    private String subject;
    private FollowUpType followUpType;
    private FollowUpStatus status;
    private Long assignedToUserId;
    private String assignedToUserName;
    private String notes;
    private Long createdByUserId;
    private String createdByUserName;
    private Instant createdAt;
    private Instant updatedAt;

    public FollowUpResponse() {}

    public static FollowUpResponse fromEntity(FollowUp f) {
        FollowUpResponse dto = new FollowUpResponse();
        dto.setId(f.getId());
        dto.setRelatedType(f.getRelatedType());
        if (f.getCustomer() != null) {
            dto.setCustomerId(f.getCustomer().getId());
            dto.setCustomerName(f.getCustomer().getCustomerName());
        }
        if (f.getLead() != null) {
            dto.setLeadId(f.getLead().getId());
            dto.setLeadName(f.getLead().getLeadName());
        }
        if (f.getOpportunity() != null) {
            dto.setOpportunityId(f.getOpportunity().getId());
            dto.setOpportunityName(f.getOpportunity().getOpportunityName());
        }
        dto.setFollowUpDate(f.getFollowUpDate());
        dto.setSubject(f.getSubject());
        dto.setFollowUpType(f.getFollowUpType());
        dto.setStatus(f.getStatus());
        if (f.getAssignedTo() != null) {
            dto.setAssignedToUserId(f.getAssignedTo().getId());
            dto.setAssignedToUserName(f.getAssignedTo().getName());
        }
        dto.setNotes(f.getNotes());
        if (f.getCreatedBy() != null) {
            dto.setCreatedByUserId(f.getCreatedBy().getId());
            dto.setCreatedByUserName(f.getCreatedBy().getName());
        }
        dto.setCreatedAt(f.getCreatedAt());
        dto.setUpdatedAt(f.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RelatedType getRelatedType() {
        return relatedType;
    }

    public void setRelatedType(RelatedType relatedType) {
        this.relatedType = relatedType;
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

    public Instant getFollowUpDate() {
        return followUpDate;
    }

    public void setFollowUpDate(Instant followUpDate) {
        this.followUpDate = followUpDate;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public FollowUpType getFollowUpType() {
        return followUpType;
    }

    public void setFollowUpType(FollowUpType followUpType) {
        this.followUpType = followUpType;
    }

    public FollowUpStatus getStatus() {
        return status;
    }

    public void setStatus(FollowUpStatus status) {
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

