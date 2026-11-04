package com.acxiom.crm.dto;

import com.acxiom.crm.entity.OpportunityStage;
import com.acxiom.crm.entity.OpportunityStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public class OpportunityRequest {

    @NotBlank(message = "Opportunity name is required")
    @Size(max = 150, message = "Opportunity name cannot exceed 150 characters")
    private String opportunityName;

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private Long leadId;

    @NotNull(message = "Opportunity Amount must be greater than 0.")
    @DecimalMin(value = "0.01", message = "Opportunity Amount must be greater than 0.")
    private BigDecimal amount;

    private OpportunityStage stage = OpportunityStage.QUALIFICATION;

    @Min(value = 0, message = "Probability must be between 0 and 100.")
    @Max(value = 100, message = "Probability must be between 0 and 100.")
    private int probability = 20;

    @NotNull(message = "Expected close date is required")
    @FutureOrPresent(message = "Expected Close Date cannot be in the past.")
    private LocalDate expectedCloseDate;

    private OpportunityStatus status = OpportunityStatus.OPEN;

    private Long assignedToUserId;

    private String source;

    private String notes;

    public OpportunityRequest() {}

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

    public Long getLeadId() {
        return leadId;
    }

    public void setLeadId(Long leadId) {
        this.leadId = leadId;
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

    public Long getAssignedToUserId() {
        return assignedToUserId;
    }

    public void setAssignedToUserId(Long assignedToUserId) {
        this.assignedToUserId = assignedToUserId;
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
}

