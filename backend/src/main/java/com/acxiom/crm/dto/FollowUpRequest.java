package com.acxiom.crm.dto;

import com.acxiom.crm.entity.FollowUpStatus;
import com.acxiom.crm.entity.FollowUpType;
import com.acxiom.crm.entity.RelatedType;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class FollowUpRequest {

    @NotNull(message = "Related type is required")
    private RelatedType relatedType;

    private Long customerId;
    private Long leadId;
    private Long opportunityId;

    @NotNull(message = "Follow-up date is required")
    @FutureOrPresent(message = "Follow-up date cannot be earlier than today.")
    private Instant followUpDate;

    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject cannot exceed 200 characters")
    private String subject;

    @NotNull(message = "Follow-up type is required")
    private FollowUpType followUpType;

    private FollowUpStatus status = FollowUpStatus.PLANNED;

    private Long assignedToUserId;

    private String notes;

    public FollowUpRequest() {}

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

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
    }

    public Long getOpportunityId() {
        return opportunityId;
    }

    public void setOpportunityId(Long opportunityId) {
        this.opportunityId = opportunityId;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

