package com.acxiom.crm.dto;

import com.acxiom.crm.entity.Opportunity;
import com.acxiom.crm.entity.OpportunityStage;
import com.acxiom.crm.entity.OpportunityStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public class OpportunityResponse {
    private Long id;
    private String opportunityName;
    private Long customerId;
    private String customerName;
    private Long leadId;
    private String leadName;
    private BigDecimal amount;
    private OpportunityStage stage;
    private int probability;
    private LocalDate expectedCloseDate;
    private OpportunityStatus status;
    private BigDecimal weightedPipeline;
    private Long assignedToUserId;
    private String assignedToUserName;
    private String source;
    private String notes;
    private Long createdByUserId;
    private String createdByUserName;
    private Instant createdAt;
    private Instant updatedAt;

    public OpportunityResponse() {}

    public static OpportunityResponse fromEntity(Opportunity opp) {
        OpportunityResponse dto = new OpportunityResponse();
        dto.setId(opp.getId());
        dto.setOpportunityName(opp.getOpportunityName());
        if (opp.getCustomer() != null) {
            dto.setCustomerId(opp.getCustomer().getId());
            dto.setCustomerName(opp.getCustomer().getCustomerName());
        }
        if (opp.getLead() != null) {
            dto.setLeadId(opp.getLead().getId());
            dto.setLeadName(opp.getLead().getLeadName());
        }
        dto.setAmount(opp.getAmount());
        dto.setStage(opp.getStage());
        dto.setProbability(opp.getProbability());
        dto.setExpectedCloseDate(opp.getExpectedCloseDate());
        dto.setStatus(opp.getStatus());
        dto.setWeightedPipeline(opp.getWeightedPipeline());
        if (opp.getAssignedTo() != null) {
            dto.setAssignedToUserId(opp.getAssignedTo().getId());
            dto.setAssignedToUserName(opp.getAssignedTo().getName());
        }
        dto.setSource(opp.getSource());
        dto.setNotes(opp.getNotes());
        if (opp.getCreatedBy() != null) {
            dto.setCreatedByUserId(opp.getCreatedBy().getId());
            dto.setCreatedByUserName(opp.getCreatedBy().getName());
        }
        dto.setCreatedAt(opp.getCreatedAt());
        dto.setUpdatedAt(opp.getUpdatedAt());
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOpportunityName() {
        return opportunityName;
    }

    public void setOpportunityName(String opportunityName) {
        this.opportunityName = opportunityName;
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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public OpportunityStage getStage() {
        return stage;
    }

    public void setStage(OpportunityStage stage) {
        this.stage = stage;
    }

    public int getProbability() {
        return probability;
    }

    public void setProbability(int probability) {
        this.probability = probability;
    }

    public LocalDate getExpectedCloseDate() {
        return expectedCloseDate;
    }

    public void setExpectedCloseDate(LocalDate expectedCloseDate) {
        this.expectedCloseDate = expectedCloseDate;
    }

    public OpportunityStatus getStatus() {
        return status;
    }

    public void setStatus(OpportunityStatus status) {
        this.status = status;
    }

    public BigDecimal getWeightedPipeline() {
        return weightedPipeline;
    }

    public void setWeightedPipeline(BigDecimal weightedPipeline) {
        this.weightedPipeline = weightedPipeline;
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

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
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

